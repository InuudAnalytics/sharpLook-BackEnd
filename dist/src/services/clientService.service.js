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
                vendor: {
                    include: {
                        vendorOnboarding: true, // 👈 include vendor onboarding info
                    },
                },
            },
        });
        return services;
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
