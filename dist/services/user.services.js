"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccount = exports.updateUserAvatar = exports.getAllVendors = exports.getVendorDetails = exports.getTopRatedVendors = exports.updateClientLocationPreferences = exports.updateUserProfile = exports.getUserById = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const cloudinary_1 = require("../utils/cloudinary");
const client_1 = require("@prisma/client");
const getUserById = async (id) => {
    return await prisma_1.default.user.findUnique({ where: { id } });
};
exports.getUserById = getUserById;
const updateUserProfile = async (id, data) => {
    return await prisma_1.default.user.update({
        where: { id },
        data
    });
};
exports.updateUserProfile = updateUserProfile;
const updateClientLocationPreferences = async (userId, latitude, longitude, radiusKm) => {
    return await prisma_1.default.user.update({
        where: { id: userId },
        data: {
            preferredLatitude: latitude,
            preferredLongitude: longitude,
            preferredRadiusKm: radiusKm,
        },
    });
};
exports.updateClientLocationPreferences = updateClientLocationPreferences;
const getTopRatedVendors = async (limit = 10) => {
    const topVendors = await prisma_1.default.user.findMany({
        where: { role: "VENDOR" },
        include: {
            vendorOnboarding: true,
            vendorReviews: true,
            vendorServices: true,
            vendorAvailability: true,
            promotions: true,
            wallet: true,
            products: true, // fetch all products, then filter
        },
    });
    const sorted = topVendors
        .map((vendor) => {
        const reviews = vendor.vendorReviews || [];
        const total = reviews.length;
        const avgRating = total > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / total
            : 0;
        // Filter approved products only
        const approvedProducts = (vendor.products || []).filter((product) => product.approvalStatus === client_1.ApprovalStatus.APPROVED);
        return {
            ...vendor,
            rating: avgRating,
            totalReviews: total,
            products: approvedProducts,
        };
    })
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    return sorted;
};
exports.getTopRatedVendors = getTopRatedVendors;
const getVendorDetails = async (vendorId) => {
    const vendor = await prisma_1.default.user.findUnique({
        where: {
            id: vendorId,
        },
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
                    createdAt: 'desc',
                },
            },
            promotions: {
                where: {
                    isActive: true,
                },
                orderBy: {
                    startDate: 'desc',
                },
            },
            products: true, // fetch all products, filter below
            wallet: true,
            cartItems: true,
            wishlistItems: true,
            orders: true,
            referralsMade: true,
            referralsGotten: true,
            notifications: true,
            sentMessages: true,
            receivedMessages: true,
        },
    });
    if (!vendor)
        return null;
    // Filter only approved products
    const approvedProducts = (vendor.products || []).filter((product) => product.approvalStatus === client_1.ApprovalStatus.APPROVED);
    // Compute average rating & total reviews
    const reviews = vendor.vendorReviews || [];
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
        : 0;
    return {
        ...vendor,
        products: approvedProducts,
        totalReviews,
        avgRating,
    };
};
exports.getVendorDetails = getVendorDetails;
const getAllVendors = async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    // Fetch vendors with relations
    const vendors = await prisma_1.default.user.findMany({
        where: { role: "VENDOR" },
        skip,
        take: limit,
        include: {
            vendorOnboarding: true,
            vendorAvailability: true,
            vendorServices: true,
            vendorReviews: true,
            promotions: {
                where: { isActive: true },
            },
            products: true, // we'll filter approved ones below
            wallet: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    // Get total vendor count (for pagination)
    const totalVendors = await prisma_1.default.user.count({
        where: { role: "VENDOR" },
    });
    // Process vendors (compute ratings, filter products)
    const processed = vendors.map((vendor) => {
        const reviews = vendor.vendorReviews || [];
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;
        const approvedProducts = (vendor.products || []).filter((p) => p.approvalStatus === client_1.ApprovalStatus.APPROVED);
        return {
            ...vendor,
            avgRating,
            totalReviews,
            products: approvedProducts,
        };
    });
    // Return paginated structure
    return {
        vendors: processed,
        pagination: {
            total: totalVendors,
            page,
            limit,
            totalPages: Math.ceil(totalVendors / limit),
            hasNextPage: page * limit < totalVendors,
            hasPrevPage: page > 1,
        },
    };
};
exports.getAllVendors = getAllVendors;
const updateUserAvatar = async (userId, fileBuffer) => {
    const cloudinaryResult = await (0, cloudinary_1.uploadBufferToCloudinary)(fileBuffer, "avatars");
    const user = await prisma_1.default.user.update({
        where: { id: userId },
        data: { avatar: cloudinaryResult.secure_url },
    });
    return user.avatar;
};
exports.updateUserAvatar = updateUserAvatar;
const deleteUserAccount = async (userId) => {
    // Ensure the user exists
    const existingUser = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
        throw new Error("User not found.");
    }
    // Delete related entities if required (cascading logic can vary based on your needs)
    // Example: Delete VendorOnboarding if exists
    await prisma_1.default.vendorOnboarding.deleteMany({
        where: { userId },
    });
    // You may want to soft delete instead (e.g., mark `isBanned = true` or `deletedAt = Date`)
    await prisma_1.default.user.delete({ where: { id: userId } });
    return { success: true, message: "Account deleted successfully." };
};
exports.deleteUserAccount = deleteUserAccount;
