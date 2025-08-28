"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorProfile = exports.getVendorsByService = exports.getAllVendorServices = exports.findNearbyVendors = exports.updateServiceRadiusAndLocation = exports.getVendorAvailability = exports.setVendorAvailability = exports.getVendorSpecialties = exports.updateVendorSpecialties = exports.getPortfolioImages = exports.addPortfolioImages = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const distance_1 = require("../utils/distance");
const client_1 = require("@prisma/client");
const addPortfolioImages = async (userId, imageUrls) => {
    return await prisma_1.default.vendorOnboarding.update({
        where: { userId },
        data: {
            portfolioImages: { push: imageUrls },
        },
    });
};
exports.addPortfolioImages = addPortfolioImages;
const getPortfolioImages = async (userId) => {
    return await prisma_1.default.vendorOnboarding.findUnique({
        where: { userId },
        select: { portfolioImages: true },
    });
};
exports.getPortfolioImages = getPortfolioImages;
const updateVendorSpecialties = async (userId, specialties) => {
    return await prisma_1.default.vendorOnboarding.update({
        where: { userId },
        data: { specialties },
    });
};
exports.updateVendorSpecialties = updateVendorSpecialties;
const getVendorSpecialties = async (userId) => {
    return await prisma_1.default.vendorOnboarding.findUnique({
        where: { userId },
        select: { specialties: true },
    });
};
exports.getVendorSpecialties = getVendorSpecialties;
const setVendorAvailability = async (vendorId, days, fromTime, toTime) => {
    return await prisma_1.default.vendorAvailability.upsert({
        where: { vendorId },
        update: { days, fromTime, toTime },
        create: { vendorId, days, fromTime, toTime },
    });
};
exports.setVendorAvailability = setVendorAvailability;
const getVendorAvailability = async (vendorId) => {
    return await prisma_1.default.vendorAvailability.findUnique({ where: { vendorId } });
};
exports.getVendorAvailability = getVendorAvailability;
const updateServiceRadiusAndLocation = async (userId, radiusKm, latitude, longitude) => {
    return await prisma_1.default.vendorOnboarding.update({
        where: { userId },
        data: {
            serviceRadiusKm: radiusKm,
            latitude,
            longitude,
        },
    });
};
exports.updateServiceRadiusAndLocation = updateServiceRadiusAndLocation;
const findNearbyVendors = async (clientLat, clientLon) => {
    const allVendors = await prisma_1.default.user.findMany({
        where: { role: "VENDOR" },
        include: {
            vendorOnboarding: true,
            vendorReviews: true,
            vendorServices: true,
            vendorAvailability: true,
            promotions: true,
            wallet: true,
            products: true,
        },
    });
    const filteredAndMapped = allVendors
        .filter((vendor) => {
        const onboarding = vendor.vendorOnboarding;
        if (!onboarding || onboarding.latitude == null || onboarding.longitude == null || onboarding.serviceRadiusKm == null) {
            return false;
        }
        const distance = (0, distance_1.haversineDistanceKm)(clientLat, clientLon, onboarding.latitude, onboarding.longitude);
        return distance <= onboarding.serviceRadiusKm;
    })
        .map((vendor) => {
        const reviews = vendor.vendorReviews || [];
        const total = reviews.length;
        const avgRating = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;
        const approvedProducts = (vendor.products || []).filter((product) => product.approvalStatus === client_1.ApprovalStatus.APPROVED);
        return {
            ...vendor,
            rating: avgRating,
            totalReviews: total,
            products: approvedProducts,
        };
    });
    return filteredAndMapped;
};
exports.findNearbyVendors = findNearbyVendors;
const getAllVendorServices = async () => {
    const vendors = await prisma_1.default.vendorOnboarding.findMany({
        select: { servicesOffered: true },
    });
    const allServices = vendors.flatMap(v => v.servicesOffered);
    const uniqueServices = Array.from(new Set(allServices));
    return uniqueServices;
};
exports.getAllVendorServices = getAllVendorServices;
const getVendorsByService = async (service) => {
    if (!service) {
        return await prisma_1.default.vendorOnboarding.findMany({
            include: { user: true },
        });
    }
    return await prisma_1.default.vendorOnboarding.findMany({
        where: {
            servicesOffered: {
                has: service,
            },
        },
        include: { user: true },
    });
};
exports.getVendorsByService = getVendorsByService;
const updateVendorProfile = async (vendorId, data) => {
    return await prisma_1.default.vendorOnboarding.update({
        where: { id: vendorId },
        data
    });
};
exports.updateVendorProfile = updateVendorProfile;



const deleteVendorAccount = async (userId) => {
    const existingUser = await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            vendorOnboarding: true,
            vendorAvailability: true,
            vendorServices: true,
            vendorReviews: true,
            promotions: true,
            wallet: true,
            products: true,
        },
    });
    if (!existingUser || existingUser.role !== 'VENDOR') {
        throw new Error("Vendor not found or invalid user type.");
    }
    // Delete all related records
    await prisma_1.default.vendorAvailability.deleteMany({ where: { vendorId: userId } });
    await prisma_1.default.vendorService.deleteMany({ where: { userId } });
    await prisma_1.default.review.deleteMany({ where: { vendorId: userId } });
    await prisma_1.default.promotion.deleteMany({ where: { vendorId: userId } });
    await prisma_1.default.product.deleteMany({ where: { vendorId: userId } });
    await prisma_1.default.vendorOnboarding.deleteMany({ where: { userId } });
    // Finally delete the user record
    await prisma_1.default.user.delete({ where: { id: userId } });
    await prisma_1.default.wallet.deleteMany({ where: { userId } });
    return { success: true, message: "Vendor account deleted successfully." };
};
exports.deleteVendorAccount = deleteVendorAccount;
