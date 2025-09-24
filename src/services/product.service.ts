import prisma from "../config/prisma"
import uploadToCloudinary  from "../utils/cloudinary"

import { ApprovalStatus } from "@prisma/client";
export const createProduct = async (
  vendorId: string,
  productName: string,
  price: number,
  qtyAvailable: number,
  description: string,
   picture: string,
) => {
  const status = qtyAvailable === 0 ? "not in stock" : "in stock"

  return await prisma.product.create({
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
  })
}




export const getVendorProducts = async (vendorId: string) => {
  return await prisma.product.findMany({
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



export const getAllProducts = async () => {
  return await prisma.product.findMany({
    where: {
      approvalStatus: ApprovalStatus.APPROVED,
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

// new getAllProductsRatingsService
export const getAllProductsRatingsService = async () => {
  const products = await prisma.product.findMany({
    where: {
approvalStatus: ApprovalStatus.APPROVED,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      reviews: {
        where: {
          type: "PRODUCT",
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
          products: true,
          cartItems: true,
          wishlistItems: true,
          orders: true,
        },
      },
    },
  });

  // Compute average rating and append to each product
  const enrichedProducts = products.map((product) => {
    const totalRatings = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const reviewCount = product.reviews.length;
    const rating = reviewCount > 0 ? parseFloat((totalRatings / reviewCount).toFixed(1)) : null;

    return {
      ...product,
      rating, 
    };
  });


  return {
    success: true,
    message: "All products fetched successfully",
    data: enrichedProducts,
  };
};


export const getTopSellingProducts = async (limit = 10) => {
  return await prisma.product.findMany({
    where: {
      unitsSold: {
        gt: 0,
      },
      approvalStatus: ApprovalStatus.APPROVED, // Only approved products
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






export const updateProduct = async (
  productId: string,
  vendorId: string,
  productName: string,
  price: number,
  qtyAvailable: number,
  description: string,
  picture?: string,
  
) => {
  const status = qtyAvailable === 0 ? "not in stock" : "in stock"

  return await prisma.product.update({
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
  })
}



export const deleteProduct = async (productId: string) => {
  return await prisma.product.delete({
    where: { id: productId },
  })
}