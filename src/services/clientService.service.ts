// clientService.service.ts

import prisma from "../config/prisma"



export const getAllVendorServices = async () => {
  try {
    const services = await prisma.vendorService.findMany({
      include: {
        reviews: true, // Include all related reviews
        vendor: {
          include: {
            vendorOnboarding: true,
          },
        },
      },
    });

    // Add average rating and review count manually
    const servicesWithRatings = services.map((service) => {
      const totalReviews = service.reviews.length;
      const averageRating =
        totalReviews > 0
          ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          : 0;

      return {
        ...service,
        averageRating,
        reviewCount: totalReviews,
      };
    });

    return servicesWithRatings;
  } catch (error) {
    console.error('Failed to fetch all services:', error);
    throw error;
  }
};



export const getVendorServicesByVendorId = async (userId: string) => {
  return await prisma.vendorService.findMany({
    where: { userId },
    include: {
      vendor: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          vendorOnboarding: true,
        },
      },
    },
  })
}
