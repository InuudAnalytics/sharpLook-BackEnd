"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorProfile = exports.getVendorOnboarding = exports.createVendorOnboarding = void 0;
// src/services/vendorOnboarding.service.ts
const prisma_1 = __importDefault(require("../config/prisma"));
const createVendorOnboarding = async (userId, serviceType, identityImageUrl) => {
    return await prisma_1.default.vendorOnboarding.create({
        data: {
            userId,
            serviceType,
            identityImage: identityImageUrl, // Maps to your schema's identityImage
        },
    });
};
exports.createVendorOnboarding = createVendorOnboarding;
const getVendorOnboarding = async (userId) => {
    return await prisma_1.default.vendorOnboarding.findUnique({
        where: { userId },
    });
};
exports.getVendorOnboarding = getVendorOnboarding;
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const updateVendorProfile = async (vendorId, { bio, location, servicesOffered, portfolioFiles, availability, ...rest }) => {
    // 🧠 Parse incoming data if needed
    const parsedAvailability = typeof availability === "string" ? JSON.parse(availability) : availability;
    const parsedServicesOffered = typeof servicesOffered === "string"
        ? JSON.parse(servicesOffered)
        : servicesOffered;
    // 🖼️ Upload images to Cloudinary
    let portfolioImages = [];
    if (portfolioFiles && portfolioFiles.length > 0) {
        for (const file of portfolioFiles) {
            const result = await (0, cloudinary_1.default)(file.buffer, file.mimetype);
            portfolioImages.push(result.secure_url);
        }
    }
    // 🔧 Update onboarding info
    const updatedProfile = await prisma_1.default.vendorOnboarding.update({
        where: { userId: vendorId },
        data: {
            bio,
            location,
            servicesOffered: parsedServicesOffered,
            portfolioImages,
            ...rest,
        },
    });
    // 🗓️ Upsert availability
    let availabilityRecord = null;
    if (parsedAvailability) {
        availabilityRecord = await prisma_1.default.vendorAvailability.upsert({
            where: { vendorId },
            update: {
                days: parsedAvailability.days,
                fromTime: parsedAvailability.fromTime,
                toTime: parsedAvailability.toTime,
            },
            create: {
                vendorId,
                days: parsedAvailability.days,
                fromTime: parsedAvailability.fromTime,
                toTime: parsedAvailability.toTime,
            },
        });
    }
    return {
        onboarding: updatedProfile,
        availability: availabilityRecord,
    };
};
exports.updateVendorProfile = updateVendorProfile;
