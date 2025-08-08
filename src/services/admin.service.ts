// src/services/admin.service.ts
import prisma from "../config/prisma"
import { Role, BroadcastAudience, BroadcastChannel , DeductionStartOption} from "@prisma/client"
import { subDays, subWeeks, subMonths, subYears } from "date-fns";
import { ApprovalStatus } from '@prisma/client';

import bcrypt from "bcryptjs"; 



import { generateReferralCode } from "../utils/referral";
import { sendMail } from "../helpers/email.helper";


const ADMIN_ROLES = [
  "SUPERADMIN",
  "ADMIN",
  "MODERATOR",
  "ANALYST",
  "FINANCE_ADMIN",
  "CONTENT_MANAGER",
  "SUPPORT",
] as const;

export const sendBroadcast = async (
  adminId: string,
  title: string,
  message: string,
  audience: BroadcastAudience,
  channel: BroadcastChannel
) => {
  const broadcast = await prisma.broadcast.create({
    data: {
      title,
      message,
      audience,
      channel,
      createdById: adminId,
    },
  });

  const roles: Role[] =
    audience === "BOTH"
      ? ["CLIENT", "VENDOR"]
      : [audience === "CLIENT" ? "CLIENT" : "VENDOR"];

  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true, email: true, firstName: true },
  });

  if (users.length === 0) return broadcast;

  if (channel === "EMAIL") {
    for (const user of users) {
      if (user.email) {
        const html = `
          <p>Hi ${user.firstName || "there"},</p>
          <p>${message}</p>
          <p>— From the SHARPLOOK Team</p>
        `;
        await sendMail(user.email, title, html);
      }
    }
  }

  if (channel === "PUSH_NOTIFICATION") {
    const notifications = users.map((user) => ({
      userId: user.id,
      message,
      type: "BROADCAST",
    }));
    await prisma.notification.createMany({ data: notifications });
  }

  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: { sentCount: users.length },
  });

  return { message: `Broadcast sent to ${users.length} users via ${channel}.` };
};




export const getAllBroadcasts = async () => {
  const broadcasts = await prisma.broadcast.findMany({
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



export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
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

export const getAllBookings = async () => {
  return await prisma.booking.findMany({
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


export const banUser = async (userId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true }, 
  })
}

export const unbanUser = async (userId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false },
  })
}


export const promoteUserToAdmin = async (adminId: string) => {

  console.log(adminId);
  
  const user = await prisma.user.findUnique({ where: { id: adminId } });

  if (!user) throw new Error("User not found");

  return await prisma.user.update({
    where: { id: adminId },
    data: {
      role: "ADMIN",
      powerGiven: true, // ✅ Set admin power as granted
    },
  });
};

export const getUsersByRole = async (role: Role) => {
  return await prisma.user.findMany({
    where: { role },
    orderBy: { createdAt: "desc" }
  });
};



export const getNewUsersByRange = async (range: string) => {
  let date: Date;

  switch (range) {
    case "days":
      date = subDays(new Date(), 7);
      break;
    case "weeks":
      date = subWeeks(new Date(), 4);
      break;
    case "months":
      date = subMonths(new Date(), 6);
      break;
    case "years":
      date = subYears(new Date(), 1);
      break;
    default:
      throw new Error("Invalid range");
  }

  return await prisma.user.findMany({
    where: { createdAt: { gte: date } },
    orderBy: { createdAt: "desc" }
  });
};


export const getDailyActiveUsers = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.user.findMany({
    where: { updatedAt: { gte: today } }
  });
}

export const getAllProducts = async () => {
  const allProducts = await prisma.product.findMany({
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
    if (!acc[status]) acc[status] = [];
    acc[status].push(product);
    return acc;
  }, {} as Record<string, typeof allProducts>);

  return grouped;
};


export const getSoldProducts = async () => {
  return await prisma.product.findMany({
    where: { qtyAvailable: 0 },
    orderBy: { createdAt: "desc" }
  });
};


export const getUserDetail = async (userId: string) => {
  return await prisma.user.findUnique({
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



export const deleteUser = async (userId: string) => {
  // Step 1: Break required relations

  // Self-relation: referrals
  await prisma.user.updateMany({
    where: { referredById: userId },
    data: { referredById: null },
  });

  // ServiceOfferBooking (client and vendor)
  await prisma.serviceOfferBooking.deleteMany({
    where: {
      OR: [
        { clientId: userId },
        { vendorId: userId },
      ],
    },
  });

  // Update VendorAvailability to remove reference
  await prisma.vendorAvailability.deleteMany({
    where: { vendorId: userId },
  });

  // Update Wallet if exists (remove userId to avoid FK issue)
 await prisma.wallet.update({
  where: { userId: userId },
  data: {
    // your update fields
  },
});


  // Step 2: Delete dependent data (optional relations)
  await prisma.review.deleteMany({
    where: {
      OR: [{ vendorId: userId }, { clientId: userId }],
    },
  });

  await prisma.booking.deleteMany({
    where: {
      OR: [{ vendorId: userId }, { clientId: userId }],
    },
  });

  await prisma.message.deleteMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });

  await prisma.vendorOnboarding.deleteMany({
    where: { userId },
  });

  await prisma.cartItem.deleteMany({
    where: { userId },
  });

  await prisma.wishlistItem.deleteMany({
    where: { userId },
  });

  await prisma.referral.deleteMany({
    where: {
      OR: [{ referredById: userId }, { referredUserId: userId }],
    },
  });

  await prisma.promotion.deleteMany({
    where: { vendorId: userId },
  });

  await prisma.notification.deleteMany({
    where: { userId },
  });

  await prisma.serviceOffer.deleteMany({
    where: { clientId: userId },
  });

  await prisma.vendorOffer.deleteMany({
    where: { vendorId: userId },
  });

  await prisma.product.deleteMany({
    where: { vendorId: userId },
  });

  await prisma.order.deleteMany({
    where: { userId },
  });

  await prisma.withdrawalRequest.deleteMany({
    where: { userId },
  });

  await prisma.adminAction.deleteMany({
    where: { adminId: userId },
  });

  await prisma.broadcast.deleteMany({
    where: { createdById: userId },
  });

  // Step 3: Delete the user
  const deleted = await prisma.user.delete({
    where: { id: userId },
  });

  return deleted;
};



export const deleteVendorService = async (serviceId: string) => {
  // Step 1: Break relations or delete dependent data

  // Delete all related reviews
  await prisma.review.deleteMany({
    where: { serviceId },
  });

  // Delete all related bookings
  await prisma.booking.deleteMany({
    where: { serviceId },
  });

  // Step 2: Delete the vendor service
  const deletedService = await prisma.vendorService.delete({
    where: { id: serviceId },
  });

  return {
    message: "Vendor service deleted successfully",
    deletedService,
  };
};



export const getProductDetail = async (productId: string) => {
  return await prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: true,
      reviews: true,
    },
  });
};


export const deleteProduct = async (productId: string) => {
  return await prisma.product.delete({ where: { id: productId } });
};


export const approveProduct = async (productId: string) => {
  return await prisma.product.update({
    where: { id: productId },
    data: { approvalStatus: ApprovalStatus.APPROVED },
  });
};


export const suspendProduct = async (productId: string) => {
  return await prisma.product.update({
    where: { id: productId },
    data: { approvalStatus: ApprovalStatus.SUSPENDED },
  });
};

export const rejectProduct = async (productId: string, reason?: string) => {
  return await prisma.product.update({
    where: { id: productId },
    data: { approvalStatus: ApprovalStatus.REJECTED , description: reason || "" },
  });
};


export const getAllOrders = async () => {
  return await prisma.order.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" }
  });
};

export const getAllPayments = async () => {
  return await prisma.transaction.findMany({
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
;

export const getAllBookingsDetailed = async () => {
  return await prisma.booking.findMany({
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


export const getAllDisputes = async () => {
  return await prisma.dispute.findMany({
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
          email: true,  // optional, if you want email as well
        }
      },
      booking: true, // or select specific fields if needed
    },
    orderBy: { createdAt: "desc" },
  });
};



export const resolveDispute = async (disputeId: string, resolution: string) => {
  return await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: "RESOLVED",
      resolution,
    },
  });
};
export const verifyVendorIdentity = async (vendorId: string) => {
  return prisma.vendorOnboarding.update({
    where: { userId: vendorId },
    data: { bio: "Verified by admin" } 
  });
};


export const getAllPromotions = async () => {
  return prisma.promotion.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" }
  });
};

export const suspendPromotion = async (promotionId: string) => {
  return prisma.promotion.update({
    where: { id: promotionId },
    data: { isActive: false }
  });
};


export const deleteReview = async (reviewId: string) => {
  return prisma.review.delete({
    where: { id: reviewId }
  });
};

export const getAllReviewsWithContent = async () => {
  return prisma.review.findMany({
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


export const getAllMessages = async () => {
  return prisma.message.findMany({
    include: {
      sender: true,
      receiver: true
    },
    orderBy: { createdAt: "desc" }
  });
};


export const getReferralHistory = async () => {
  return prisma.referral.findMany({
    include: {
      referredBy: true,
      referredUser: true
    },
    orderBy: { createdAt: "desc" }
  });
};


export const adjustWalletBalance = async (userId: string, amount: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { wallet: true } });
  if (!user || !user.walletId) throw new Error("Wallet not found");

  return prisma.wallet.update({
    where: { id: user.walletId },
    data: {
      balance: { increment: amount }
    }
  });
};






export const getPlatformStats = async () => {
  const oneWeekAgo = subDays(new Date(), 7);

  const [
    totalUsers,
    totalVendors,
    totalBookings,
    totalDisputes,
    totalTransactions,
    totalProducts,
    inStockProducts,
    outOfStockProducts,
    totalUnitsSold,
    newProductsThisWeek,
    totalEmailVerified,
    totalPhoneVerified,
    totalAcceptedPersonalData
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "VENDOR" } }),
    prisma.booking.count(),
    prisma.dispute.count(),
    prisma.transaction.count(),
    prisma.product.count(),
    prisma.product.count({ where: { qtyAvailable: { gt: 0 } } }),
    prisma.product.count({ where: { qtyAvailable: 0 } }),
    prisma.product.aggregate({ _sum: { unitsSold: true } }),
    prisma.product.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.user.count({ where: { isEmailVerified: true } }),
    prisma.user.count({ where: { isOtpVerified: true } }),
    prisma.user.count({ where: { acceptedPersonalData: true } })
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



export const getAllNotifications = async () => {
  return await prisma.notification.findMany({
    include: {
      user: true, // If notifications are tied to users
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};


export const getAllServices = async () => {
  return await prisma.vendorService.findMany({
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




// services/admin.service.ts



export const updateProductAsAdmin = async (
  productId: string,
  productName: string,
  price: number,
  qtyAvailable: number,
  description: string,
  picture?: string,
  approvalStatus?: ApprovalStatus
) => {
  const status = qtyAvailable === 0 ? "not in stock" : "in stock";

  return await prisma.product.update({
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

import { ObjectId } from "mongodb";


export const createUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: Role, // Comes from frontend
  phone?: string
) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const referralCode = generateReferralCode();
      const walletId = new ObjectId().toString();  

  const newUser = await prisma.user.create({
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



export interface UpdateAdminPayload {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: Role; // VENDOR or CLIENT should be rejected
  adminRole?: AdminRole;
  isBanned?: boolean;
  powerGiven?: boolean;
}



export interface UpdateAdminPayload {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: Role; // e.g., ADMIN, SUPERADMIN, MODERATOR, etc.
  adminRole?: AdminRole;
  isBanned?: boolean;
  powerGiven?: boolean;
}




export const updateAdmin = async (payload: UpdateAdminPayload) => {
  const { id, password, role, ...rest } = payload;

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new Error("User not found.");
  }

  const isAdmin = ADMIN_ROLES.includes(existingUser.role as AdminRole);
  if (!isAdmin) {
    throw new Error("Only admin users can be updated with this service.");
  }

  if (role && !ADMIN_ROLES.includes(role as AdminRole)) {
    throw new Error(`Invalid role "${role}". Allowed roles: ${ADMIN_ROLES.join(", ")}`);
  }

  const updateData: any = { ...rest };

  if (role) updateData.role = role;
  if (password) updateData.password = await bcrypt.hash(password, 10);

  const updatedAdmin = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return updatedAdmin;
};


export const createServiceCategory = async (name: string) => {
  return await prisma.serviceCategory.create({
    data: {
      name,
    },
  });
};

export const getAllServiceCategories = async () => {
  return await prisma.serviceCategory.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const deleteServiceCategoryById = async (id: string) => {
  return await prisma.serviceCategory.delete({
    where: { id },
  });
};


export const getAllAdmins = async () => {
  const adminRoles: Role[] = [
    Role.ADMIN,
    Role.SUPERADMIN,
    Role.MODERATOR,
    Role.ANALYST,
    Role.FINANCE_ADMIN,
    Role.CONTENT_MANAGER,
    Role.SUPPORT,
  ];

  return await prisma.user.findMany({
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




type AdminRole = typeof ADMIN_ROLES[number];

export const deleteAdmin = async (adminId: string) => {
  // Check if user exists and is an admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  });

  if (!admin || !ADMIN_ROLES.includes(admin.role as AdminRole)) {
    throw new Error("User is not an admin or does not exist.");
  }

  // Delete related admin data
  await prisma.adminAction.deleteMany({
    where: { adminId },
  });

  await prisma.broadcast.deleteMany({
    where: { createdById: adminId },
  });

  // Delete the admin user
  const deletedAdmin = await prisma.user.delete({
    where: { id: adminId },
  });

  return deletedAdmin;
};


export const editAdmin = async (
  adminId: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    role?: AdminRole;
  }
) => {
  
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  });

  if (!admin || !ADMIN_ROLES.includes(admin.role as AdminRole)) {
    throw new Error("User is not an admin or does not exist.");
  }


  if (data.password) {
   
    data.password =   await bcrypt.hash(data.password, 10)    
  }

  const updatedAdmin = await prisma.user.update({
    where: { id: adminId },
    data,
  });

  return updatedAdmin;
};



export class VendorCommissionSettingService {
  static async setCommissionRate(userId: string, commissionRate: number, deductionStart: DeductionStartOption) {
    const existing = await prisma.vendorCommissionSetting.findUnique({ where: { userId } });

    if (existing) {
      return prisma.vendorCommissionSetting.update({
        where: { userId },
        data: { commissionRate, deductionStart }
      });
    } else {
      return prisma.vendorCommissionSetting.create({
        data: { userId, commissionRate, deductionStart }
      });
    }
  }

  static async getCommissionRate(userId: string) {
    return prisma.vendorCommissionSetting.findUnique({ where: { userId } });
  }

  static async deleteCommissionSetting(userId: string) {
    return prisma.vendorCommissionSetting.delete({ where: { userId } });
  }

   static async setCommissionRateForAllVendors(commissionRate: number, deductionStart: DeductionStartOption) {
    
    const vendors = await prisma.user.findMany({
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
    const upserts = vendors.map((vendor) =>
      prisma.vendorCommissionSetting.upsert({
        where: { userId: vendor.id },
        update: { commissionRate, deductionStart },
        create: { userId: vendor.id, commissionRate, deductionStart },
      })
    );

    await prisma.$transaction(upserts);

    return { updatedVendors: vendors.length };
  }
}