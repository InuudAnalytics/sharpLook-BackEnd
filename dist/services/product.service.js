"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getTopSellingProducts = exports.getAllProducts = exports.getVendorProducts = exports.createProduct = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const createProduct = async (vendorId, productName, price, qtyAvailable, description, picture) => {
    const status = qtyAvailable === 0 ? "not in stock" : "in stock";
    return await prisma_1.default.product.create({
        data: {
            productName,
            price,
            qtyAvailable,
            status,
            picture,
            description,
            vendor: {
                connect: { id: vendorId }
            }
        }
    });
};
exports.createProduct = createProduct;
const getVendorProducts = async (vendorId) => {
    return await prisma_1.default.product.findMany({
        where: {
            vendorId,
        },
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
                },
            },
        },
    });
};
exports.getVendorProducts = getVendorProducts;

const getAllProducts = async () => {
  return await prisma_1.default.product.findMany({
    where: {
      approvalStatus: ApprovalStatus.APPROVED,
    },
    orderBy: { createdAt: "desc" },
    include: {
      reviews: {
        where: {
          type: 'PRODUCT', 
        },
        select: {
          rating: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
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
};

exports.getAllProducts = getAllProducts;
const getTopSellingProducts = async (limit = 10) => {
    return await prisma_1.default.product.findMany({
        where: {
            unitsSold: {
                gt: 0,
            },
            approvalStatus: client_1.ApprovalStatus.APPROVED, // Only approved products
        },
        orderBy: {
            unitsSold: "desc",
        },
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
        take: limit,
    });
};
exports.getTopSellingProducts = getTopSellingProducts;
const updateProduct = async (productId, vendorId, productName, price, qtyAvailable, description, picture) => {
    const status = qtyAvailable === 0 ? "not in stock" : "in stock";
    return await prisma_1.default.product.update({
        where: {
            id: productId,
            vendorId: vendorId, // ensures vendor can only edit their own product
        },
        data: {
            productName,
            price,
            qtyAvailable,
            status,
            description,
            ...(picture && { picture }), // only update if a new picture was uploaded
        },
    });
};
exports.updateProduct = updateProduct;
const deleteProduct = async (productId) => {
    return await prisma_1.default.product.delete({
        where: { id: productId },
    });
};
exports.deleteProduct = deleteProduct;

const getAllProductsRatings = async () => {
  return await prisma_1.default.product.findMany({
    where: {
      approvalStatus: ApprovalStatus.APPROVED,
    },
    orderBy: { createdAt: "desc" },
    include: {
      reviews: {
        where: {
          type: 'PRODUCT', // filter to only include product reviews
        },
        select: {
          rating: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      vendor: {
        include: {
          vendorOnboarding: true,
          products: true,        
          
        },
      },
    },
  });
};

exports.getAllProductsRatings = getAllProductsRatings;

