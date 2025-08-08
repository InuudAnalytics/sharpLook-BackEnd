"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorCommissionSettingService = exports.editAdmin = exports.deleteAdmin = exports.getAllAdmins = exports.deleteServiceCategoryById = exports.getAllServiceCategories = exports.createServiceCategory = exports.updateAdmin = exports.createUser = exports.updateProductAsAdmin = exports.getAllServices = exports.getAllNotifications = exports.getPlatformStats = exports.adjustWalletBalance = exports.getReferralHistory = exports.getAllMessages = exports.getAllReviewsWithContent = exports.deleteReview = exports.suspendPromotion = exports.getAllPromotions = exports.verifyVendorIdentity = exports.resolveDispute = exports.getAllDisputes = exports.getAllBookingsDetailed = exports.getAllPayments = exports.getAllOrders = exports.rejectProduct = exports.suspendProduct = exports.approveProduct = exports.deleteProduct = exports.getProductDetail = exports.deleteVendorService = exports.deleteUser = exports.getUserDetail = exports.getSoldProducts = exports.getAllProducts = exports.getDailyActiveUsers = exports.getNewUsersByRange = exports.getUsersByRole = exports.promoteUserToAdmin = exports.unbanUser = exports.banUser = exports.getAllBookings = exports.getAllUsers = exports.getAllBroadcasts = exports.sendBroadcast = void 0;
// src/services/admin.service.ts
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const client_2 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const referral_1 = require("../utils/referral");
const email_helper_1 = require("../helpers/email.helper");
const ADMIN_ROLES = [
    "SUPERADMIN",
    "ADMIN",
    "MODERATOR",
    "ANALYST",
    "FINANCE_ADMIN",
    "CONTENT_MANAGER",
    "SUPPORT",
];
const sendBroadcast = async (adminId, title, message, audience, channel) => {
    const broadcast = await prisma_1.default.broadcast.create({
        data: {
            title,
            message,
            audience,
            channel,
            createdById: adminId,
        },
    });
    const roles = audience === "BOTH"
        ? ["CLIENT", "VENDOR"]
        : [audience === "CLIENT" ? "CLIENT" : "VENDOR"];
    const users = await prisma_1.default.user.findMany({
        where: { role: { in: roles } },
        select: { id: true, email: true, firstName: true },
    });
    if (users.length === 0)
        return broadcast;
    if (channel === "EMAIL") {
        for (const user of users) {
            if (user.email) {
                const html = `
          <p>Hi ${user.firstName || "there"},</p>
          <p>${message}</p>
          <p>— From the SHARPLOOK Team</p>
        `;
                await (0, email_helper_1.sendMail)(user.email, title, html);
            }
        }
    }
    if (channel === "PUSH_NOTIFICATION") {
        const notifications = users.map((user) => ({
            userId: user.id,
            message,
            type: "BROADCAST",
        }));
        await prisma_1.default.notification.createMany({ data: notifications });
    }
    await prisma_1.default.broadcast.update({
        where: { id: broadcast.id },
        data: { sentCount: users.length },
    });
    return { message: `Broadcast sent to ${users.length} users via ${channel}.` };
};
exports.sendBroadcast = sendBroadcast;
const getAllBroadcasts = async () => {
    const broadcasts = await prisma_1.default.broadcast.findMany({
        orderBy: { createdAt: 'desc' }, // Optional: show newest first
        include: {
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
    return broadcasts;
};
exports.getAllBroadcasts = getAllBroadcasts;
const getAllUsers = async () => {
    const users = await prisma_1.default.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            isEmailVerified: true,
            isOtpVerified: true,
            acceptedPersonalData: true,
            powerGiven: true,
            isBanned: true,
            vendorOnboarding: {
                select: {
                    businessName: true,
                    bio: true,
                    location: true,
                    serviceType: true,
                    specialties: true,
                    serviceRadiusKm: true,
                    servicesOffered: true,
                    profileImage: true,
                    createdAt: true
                }
            },
            vendorReviews: {
                select: { rating: true }
            }
        }
    });
    // Map in average rating & review count for vendors
    return users.map((user) => {
        let averageRating = null;
        let totalReviews = 0;
        if (user.role === "VENDOR" && user.vendorReviews.length > 0) {
            totalReviews = user.vendorReviews.length;
            const sum = user.vendorReviews.reduce((acc, r) => acc + r.rating, 0);
            averageRating = sum / totalReviews;
        }
        return {
            ...user,
            averageRating,
            totalReviews
        };
    });
};
exports.getAllUsers = getAllUsers;
const getAllBookings = async () => {
    return await prisma_1.default.booking.findMany({
        include: {
            client: true,
            vendor: {
                include: {
                    vendorOnboarding: {
                        select: {
                            businessName: true,
                            bio: true,
                            location: true,
                            serviceType: true,
                            specialties: true,
                            serviceRadiusKm: true,
                            profileImage: true,
                            pricing: true,
                            latitude: true,
                            longitude: true,
                            createdAt: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });
};
exports.getAllBookings = getAllBookings;
const banUser = async (userId) => {
    return await prisma_1.default.user.update({
        where: { id: userId },
        data: { isBanned: true },
    });
};
exports.banUser = banUser;
const unbanUser = async (userId) => {
    return await prisma_1.default.user.update({
        where: { id: userId },
        data: { isBanned: false },
    });
};
exports.unbanUser = unbanUser;
const promoteUserToAdmin = async (adminId) => {
    console.log(adminId);
    const user = await prisma_1.default.user.findUnique({ where: { id: adminId } });
    if (!user)
        throw new Error("User not found");
    return await prisma_1.default.user.update({
        where: { id: adminId },
        data: {
            role: "ADMIN",
            powerGiven: true, // ✅ Set admin power as granted
        },
    });
};
exports.promoteUserToAdmin = promoteUserToAdmin;
const getUsersByRole = async (role) => {
    return await prisma_1.default.user.findMany({
        where: { role },
        orderBy: { createdAt: "desc" }
    });
};
exports.getUsersByRole = getUsersByRole;
const getNewUsersByRange = async (range) => {
    let date;
    switch (range) {
        case "days":
            date = (0, date_fns_1.subDays)(new Date(), 7);
            break;
        case "weeks":
            date = (0, date_fns_1.subWeeks)(new Date(), 4);
            break;
        case "months":
            date = (0, date_fns_1.subMonths)(new Date(), 6);
            break;
        case "years":
            date = (0, date_fns_1.subYears)(new Date(), 1);
            break;
        default:
            throw new Error("Invalid range");
    }
    return await prisma_1.default.user.findMany({
        where: { createdAt: { gte: date } },
        orderBy: { createdAt: "desc" }
    });
};
exports.getNewUsersByRange = getNewUsersByRange;
const getDailyActiveUsers = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await prisma_1.default.user.findMany({
        where: { updatedAt: { gte: today } }
    });
};
exports.getDailyActiveUsers = getDailyActiveUsers;
const getAllProducts = async () => {
    const allProducts = await prisma_1.default.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            vendor: {
                include: {
                    vendorOnboarding: true,
                    vendorAvailability: true,
                    vendorServices: true,
                    vendorReviews: {
                        include: {
                            client: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                    wallet: true,
                    products: true,
                    cartItems: true,
                    wishlistItems: true,
                    orders: true,
                    referralsMade: true,
                    referralsGotten: true,
                    notifications: true,
                    sentMessages: true,
                    receivedMessages: true,
                },
            },
        },
    });
    // Group products by approvalStatus
    const grouped = allProducts.reduce((acc, product) => {
        const status = product.approvalStatus || "UNKNOWN";
        if (!acc[status])
            acc[status] = [];
        acc[status].push(product);
        return acc;
    }, {});
    return grouped;
};
exports.getAllProducts = getAllProducts;
const getSoldProducts = async () => {
    return await prisma_1.default.product.findMany({
        where: { qtyAvailable: 0 },
        orderBy: { createdAt: "desc" }
    });
};
exports.getSoldProducts = getSoldProducts;
const getUserDetail = async (userId) => {
    return await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            vendorOnboarding: true,
            wallet: true,
            clientBookings: true,
            vendorBookings: true,
            products: true,
        },
    });
};
exports.getUserDetail = getUserDetail;
const deleteUser = async (userId) => {
    // Step 1: Break required relations
    // Self-relation: referrals
    await prisma_1.default.user.updateMany({
        where: { referredById: userId },
        data: { referredById: null },
    });
    // ServiceOfferBooking (client and vendor)
    await prisma_1.default.serviceOfferBooking.deleteMany({
        where: {
            OR: [
                { clientId: userId },
                { vendorId: userId },
            ],
        },
    });
    // Update VendorAvailability to remove reference
    await prisma_1.default.vendorAvailability.deleteMany({
        where: { vendorId: userId },
    });
    // Update Wallet if exists (remove userId to avoid FK issue)
    await prisma_1.default.wallet.update({
        where: { userId: userId },
        data: {
        // your update fields
        },
    });
    // Step 2: Delete dependent data (optional relations)
    await prisma_1.default.review.deleteMany({
        where: {
            OR: [{ vendorId: userId }, { clientId: userId }],
        },
    });
    await prisma_1.default.booking.deleteMany({
        where: {
            OR: [{ vendorId: userId }, { clientId: userId }],
        },
    });
    await prisma_1.default.message.deleteMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
    });
    await prisma_1.default.vendorOnboarding.deleteMany({
        where: { userId },
    });
    await prisma_1.default.cartItem.deleteMany({
        where: { userId },
    });
    await prisma_1.default.wishlistItem.deleteMany({
        where: { userId },
    });
    await prisma_1.default.referral.deleteMany({
        where: {
            OR: [{ referredById: userId }, { referredUserId: userId }],
        },
    });
    await prisma_1.default.promotion.deleteMany({
        where: { vendorId: userId },
    });
    await prisma_1.default.notification.deleteMany({
        where: { userId },
    });
    await prisma_1.default.serviceOffer.deleteMany({
        where: { clientId: userId },
    });
    await prisma_1.default.vendorOffer.deleteMany({
        where: { vendorId: userId },
    });
    await prisma_1.default.product.deleteMany({
        where: { vendorId: userId },
    });
    await prisma_1.default.order.deleteMany({
        where: { userId },
    });
    await prisma_1.default.withdrawalRequest.deleteMany({
        where: { userId },
    });
    await prisma_1.default.adminAction.deleteMany({
        where: { adminId: userId },
    });
    await prisma_1.default.broadcast.deleteMany({
        where: { createdById: userId },
    });
    // Step 3: Delete the user
    const deleted = await prisma_1.default.user.delete({
        where: { id: userId },
    });
    return deleted;
};
exports.deleteUser = deleteUser;
const deleteVendorService = async (serviceId) => {
    // Step 1: Break relations or delete dependent data
    // Delete all related reviews
    await prisma_1.default.review.deleteMany({
        where: { serviceId },
    });
    // Delete all related bookings
    await prisma_1.default.booking.deleteMany({
        where: { serviceId },
    });
    // Step 2: Delete the vendor service
    const deletedService = await prisma_1.default.vendorService.delete({
        where: { id: serviceId },
    });
    return {
        message: "Vendor service deleted successfully",
        deletedService,
    };
};
exports.deleteVendorService = deleteVendorService;
const getProductDetail = async (productId) => {
    return await prisma_1.default.product.findUnique({
        where: { id: productId },
        include: {
            vendor: true,
            reviews: true,
        },
    });
};
exports.getProductDetail = getProductDetail;
const deleteProduct = async (productId) => {
    return await prisma_1.default.product.delete({ where: { id: productId } });
};
exports.deleteProduct = deleteProduct;
const approveProduct = async (productId) => {
    return await prisma_1.default.product.update({
        where: { id: productId },
        data: { approvalStatus: client_2.ApprovalStatus.APPROVED },
    });
};
exports.approveProduct = approveProduct;
const suspendProduct = async (productId) => {
    return await prisma_1.default.product.update({
        where: { id: productId },
        data: { approvalStatus: client_2.ApprovalStatus.SUSPENDED },
    });
};
exports.suspendProduct = suspendProduct;
const rejectProduct = async (productId, reason) => {
    return await prisma_1.default.product.update({
        where: { id: productId },
        data: { approvalStatus: client_2.ApprovalStatus.REJECTED, description: reason || "" },
    });
};
exports.rejectProduct = rejectProduct;
const getAllOrders = async () => {
    return await prisma_1.default.order.findMany({
        include: {
            user: true,
        },
        orderBy: { createdAt: "desc" }
    });
};
exports.getAllOrders = getAllOrders;
const getAllPayments = async () => {
    return await prisma_1.default.transaction.findMany({
        include: {
            wallet: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            vendorOnboarding: true, // 👈 includes vendor details if applicable
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};
exports.getAllPayments = getAllPayments;
;
const getAllBookingsDetailed = async () => {
    return await prisma_1.default.booking.findMany({
        include: {
            client: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    location: true,
                    avatar: true,
                    bio: true,
                    referralCode: true,
                    preferredLatitude: true,
                    preferredLongitude: true,
                },
            },
            vendor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    avatar: true,
                    bio: true,
                    referralCode: true,
                    vendorOnboarding: {
                        select: {
                            businessName: true,
                            serviceType: true,
                            location: true,
                            // approvalStatus: true,
                            pricing: true,
                            profileImage: true,
                            specialties: true,
                            latitude: true,
                            longitude: true,
                            serviceRadiusKm: true,
                        },
                    },
                },
            },
            service: {
                select: {
                    id: true,
                    serviceName: true,
                    servicePrice: true,
                    serviceImage: true,
                    description: true,
                },
            },
            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    type: true,
                    createdAt: true,
                    client: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            },
            dispute: {
                select: {
                    id: true,
                    reason: true,
                    status: true,
                    resolution: true,
                    imageUrl: true,
                    createdAt: true,
                    raisedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllBookingsDetailed = getAllBookingsDetailed;
const getAllDisputes = async () => {
    return await prisma_1.default.dispute.findMany({
        select: {
            id: true,
            reason: true,
            status: true,
            imageUrl: true,
            createdAt: true,
            raisedBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    email: true, // optional, if you want email as well
                }
            },
            booking: true, // or select specific fields if needed
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllDisputes = getAllDisputes;
const resolveDispute = async (disputeId, resolution) => {
    return await prisma_1.default.dispute.update({
        where: { id: disputeId },
        data: {
            status: "RESOLVED",
            resolution,
        },
    });
};
exports.resolveDispute = resolveDispute;
const verifyVendorIdentity = async (vendorId) => {
    return prisma_1.default.vendorOnboarding.update({
        where: { userId: vendorId },
        data: { bio: "Verified by admin" }
    });
};
exports.verifyVendorIdentity = verifyVendorIdentity;
const getAllPromotions = async () => {
    return prisma_1.default.promotion.findMany({
        include: { vendor: true },
        orderBy: { createdAt: "desc" }
    });
};
exports.getAllPromotions = getAllPromotions;
const suspendPromotion = async (promotionId) => {
    return prisma_1.default.promotion.update({
        where: { id: promotionId },
        data: { isActive: false }
    });
};
exports.suspendPromotion = suspendPromotion;
const deleteReview = async (reviewId) => {
    return prisma_1.default.review.delete({
        where: { id: reviewId }
    });
};
exports.deleteReview = deleteReview;
const getAllReviewsWithContent = async () => {
    return prisma_1.default.review.findMany({
        where: { comment: { not: null } },
        include: {
            vendor: true,
            client: true,
            product: true,
            service: true
        },
        orderBy: { createdAt: "desc" }
    });
};
exports.getAllReviewsWithContent = getAllReviewsWithContent;
const getAllMessages = async () => {
    return prisma_1.default.message.findMany({
        include: {
            sender: true,
            receiver: true
        },
        orderBy: { createdAt: "desc" }
    });
};
exports.getAllMessages = getAllMessages;
const getReferralHistory = async () => {
    return prisma_1.default.referral.findMany({
        include: {
            referredBy: true,
            referredUser: true
        },
        orderBy: { createdAt: "desc" }
    });
};
exports.getReferralHistory = getReferralHistory;
const adjustWalletBalance = async (userId, amount) => {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId }, include: { wallet: true } });
    if (!user || !user.walletId)
        throw new Error("Wallet not found");
    return prisma_1.default.wallet.update({
        where: { id: user.walletId },
        data: {
            balance: { increment: amount }
        }
    });
};
exports.adjustWalletBalance = adjustWalletBalance;
const getPlatformStats = async () => {
    const oneWeekAgo = (0, date_fns_1.subDays)(new Date(), 7);
    const [totalUsers, totalVendors, totalBookings, totalDisputes, totalTransactions, totalProducts, inStockProducts, outOfStockProducts, totalUnitsSold, newProductsThisWeek, totalEmailVerified, totalPhoneVerified, totalAcceptedPersonalData] = await Promise.all([
        prisma_1.default.user.count(),
        prisma_1.default.user.count({ where: { role: "VENDOR" } }),
        prisma_1.default.booking.count(),
        prisma_1.default.dispute.count(),
        prisma_1.default.transaction.count(),
        prisma_1.default.product.count(),
        prisma_1.default.product.count({ where: { qtyAvailable: { gt: 0 } } }),
        prisma_1.default.product.count({ where: { qtyAvailable: 0 } }),
        prisma_1.default.product.aggregate({ _sum: { unitsSold: true } }),
        prisma_1.default.product.count({ where: { createdAt: { gte: oneWeekAgo } } }),
        prisma_1.default.user.count({ where: { isEmailVerified: true } }),
        prisma_1.default.user.count({ where: { isOtpVerified: true } }),
        prisma_1.default.user.count({ where: { acceptedPersonalData: true } })
    ]);
    return {
        totalUsers,
        totalVendors,
        totalBookings,
        totalDisputes,
        totalTransactions,
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        totalUnitsSold: totalUnitsSold._sum.unitsSold || 0,
        newProductsThisWeek,
        totalEmailVerified,
        totalPhoneVerified,
        totalAcceptedPersonalData
    };
};
exports.getPlatformStats = getPlatformStats;
const getAllNotifications = async () => {
    return await prisma_1.default.notification.findMany({
        include: {
            user: true, // If notifications are tied to users
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};
exports.getAllNotifications = getAllNotifications;
const getAllServices = async () => {
    return await prisma_1.default.vendorService.findMany({
        include: {
            vendor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    vendorOnboarding: true // 👈 Include the onboarding details
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};
exports.getAllServices = getAllServices;
// services/admin.service.ts
const updateProductAsAdmin = async (productId, productName, price, qtyAvailable, description, picture, approvalStatus) => {
    const status = qtyAvailable === 0 ? "not in stock" : "in stock";
    return await prisma_1.default.product.update({
        where: {
            id: productId,
        },
        data: {
            productName,
            price,
            qtyAvailable,
            status,
            description,
            ...(picture && { picture }),
            ...(approvalStatus && { approvalStatus }),
        },
    });
};
exports.updateProductAsAdmin = updateProductAsAdmin;
const mongodb_1 = require("mongodb");
const createUser = async (firstName, lastName, email, password, role, // Comes from frontend
phone) => {
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error("User with this email already exists.");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const referralCode = (0, referral_1.generateReferralCode)();
    const walletId = new mongodb_1.ObjectId().toString();
    const newUser = await prisma_1.default.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            role,
            powerGiven: true,
            acceptedPersonalData: true,
            referralCode,
            isEmailVerified: true,
            isOtpVerified: true,
            isBanned: false,
            walletId
        },
    });
    return newUser;
};
exports.createUser = createUser;
const updateAdmin = async (payload) => {
    const { id, password, role, ...rest } = payload;
    const existingUser = await prisma_1.default.user.findUnique({ where: { id } });
    if (!existingUser) {
        throw new Error("User not found.");
    }
    const isAdmin = ADMIN_ROLES.includes(existingUser.role);
    if (!isAdmin) {
        throw new Error("Only admin users can be updated with this service.");
    }
    if (role && !ADMIN_ROLES.includes(role)) {
        throw new Error(`Invalid role "${role}". Allowed roles: ${ADMIN_ROLES.join(", ")}`);
    }
    const updateData = { ...rest };
    if (role)
        updateData.role = role;
    if (password)
        updateData.password = await bcryptjs_1.default.hash(password, 10);
    const updatedAdmin = await prisma_1.default.user.update({
        where: { id },
        data: updateData,
    });
    return updatedAdmin;
};
exports.updateAdmin = updateAdmin;
const createServiceCategory = async (name) => {
    return await prisma_1.default.serviceCategory.create({
        data: {
            name,
        },
    });
};
exports.createServiceCategory = createServiceCategory;
const getAllServiceCategories = async () => {
    return await prisma_1.default.serviceCategory.findMany({
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllServiceCategories = getAllServiceCategories;
const deleteServiceCategoryById = async (id) => {
    return await prisma_1.default.serviceCategory.delete({
        where: { id },
    });
};
exports.deleteServiceCategoryById = deleteServiceCategoryById;
const getAllAdmins = async () => {
    const adminRoles = [
        client_1.Role.ADMIN,
        client_1.Role.SUPERADMIN,
        client_1.Role.MODERATOR,
        client_1.Role.ANALYST,
        client_1.Role.FINANCE_ADMIN,
        client_1.Role.CONTENT_MANAGER,
        client_1.Role.SUPPORT,
    ];
    return await prisma_1.default.user.findMany({
        where: {
            role: { in: adminRoles },
        },
        orderBy: { createdAt: 'desc' }, // Optional: latest first
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            adminRole: true,
            createdAt: true,
        },
    });
};
exports.getAllAdmins = getAllAdmins;
const deleteAdmin = async (adminId) => {
    // Check if user exists and is an admin
    const admin = await prisma_1.default.user.findUnique({
        where: { id: adminId },
        select: { role: true },
    });
    if (!admin || !ADMIN_ROLES.includes(admin.role)) {
        throw new Error("User is not an admin or does not exist.");
    }
    // Delete related admin data
    await prisma_1.default.adminAction.deleteMany({
        where: { adminId },
    });
    await prisma_1.default.broadcast.deleteMany({
        where: { createdById: adminId },
    });
    // Delete the admin user
    const deletedAdmin = await prisma_1.default.user.delete({
        where: { id: adminId },
    });
    return deletedAdmin;
};
exports.deleteAdmin = deleteAdmin;
const editAdmin = async (adminId, data) => {
    const admin = await prisma_1.default.user.findUnique({
        where: { id: adminId },
        select: { role: true },
    });
    if (!admin || !ADMIN_ROLES.includes(admin.role)) {
        throw new Error("User is not an admin or does not exist.");
    }
    if (data.password) {
        data.password = await bcryptjs_1.default.hash(data.password, 10);
    }
    const updatedAdmin = await prisma_1.default.user.update({
        where: { id: adminId },
        data,
    });
    return updatedAdmin;
};
exports.editAdmin = editAdmin;
class VendorCommissionSettingService {
    static async setCommissionRate(userId, commissionRate, deductionStart) {
        const existing = await prisma_1.default.vendorCommissionSetting.findUnique({ where: { userId } });
        if (existing) {
            return prisma_1.default.vendorCommissionSetting.update({
                where: { userId },
                data: { commissionRate, deductionStart }
            });
        }
        else {
            return prisma_1.default.vendorCommissionSetting.create({
                data: { userId, commissionRate, deductionStart }
            });
        }
    }
    static async getCommissionRate(userId) {
        return prisma_1.default.vendorCommissionSetting.findUnique({ where: { userId } });
    }
    static async deleteCommissionSetting(userId) {
        return prisma_1.default.vendorCommissionSetting.delete({ where: { userId } });
    }
    static async setCommissionRateForAllVendors(commissionRate, deductionStart) {
        const vendors = await prisma_1.default.user.findMany({
            where: {
                role: "VENDOR",
                vendorOnboarding: {
                    serviceType: "HOME_SERVICE",
                },
            },
            select: { id: true }
        });
        if (vendors.length === 0) {
            throw new Error("No vendors found");
        }
        // Upsert commission settings for each vendor
        const upserts = vendors.map((vendor) => prisma_1.default.vendorCommissionSetting.upsert({
            where: { userId: vendor.id },
            update: { commissionRate, deductionStart },
            create: { userId: vendor.id, commissionRate, deductionStart },
        }));
        await prisma_1.default.$transaction(upserts);
        return { updatedVendors: vendors.length };
    }
}
exports.VendorCommissionSettingService = VendorCommissionSettingService;
