"use strict";
// clientService.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorServicesByVendorId = exports.getAllVendorServices = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getAllVendorServices = async () => {
    try {
        const services = await prisma_1.default.vendorService.findMany({
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
            const averageRating = totalReviews > 0
                ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
                : 0;
            return {
                ...service,
                averageRating,
                reviewCount: totalReviews,
            };
        });
        return servicesWithRatings;
    }
    catch (error) {
        console.error('Failed to fetch all services:', error);
        throw error;
    }
};
exports.getAllVendorServices = getAllVendorServices;
const getVendorServicesByVendorId = async (userId) => {
    return await prisma_1.default.vendorService.findMany({
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
    });
};
exports.getVendorServicesByVendorId = getVendorServicesByVendorId;
