"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorProfile = exports.getVendorsByService = exports.getAllVendorServices = exports.findNearbyVendors = exports.updateServiceRadiusAndLocation = exports.getVendorAvailability = exports.setVendorAvailability = exports.getVendorSpecialties = exports.updateVendorSpecialties = exports.getPortfolioImages = exports.addPortfolioImages = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const distance_1 = require("../utils/distance");
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
    const allVendors = await prisma_1.default.vendorOnboarding.findMany({
        where: {
            latitude: { not: null },
            longitude: { not: null },
            serviceRadiusKm: { not: null },
        },
        include: {
            user: {
                include: {
                    vendorServices: true, // ✅ Vendor's services
                    products: true, // ✅ Vendor's products
                },
            },
        },
    });
    // Filter by distance
    return allVendors.filter((vendor) => {
        const { latitude, longitude, serviceRadiusKm } = vendor;
        const distance = (0, distance_1.haversineDistanceKm)(clientLat, clientLon, latitude, longitude);
        return distance <= serviceRadiusKm;
    });
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
