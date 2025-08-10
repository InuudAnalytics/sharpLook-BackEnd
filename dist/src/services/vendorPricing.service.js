"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorPricing = exports.updateVendorPricing = void 0;
// src/services/vendorPricing.service.ts
const prisma_1 = __importDefault(require("../config/prisma"));
const updateVendorPricing = async (userId, pricing) => {
    return await prisma_1.default.vendorOnboarding.update({
        where: { userId },
        data: { pricing },
    });
};
exports.updateVendorPricing = updateVendorPricing;
const getVendorPricing = async (userId) => {
    const vendor = await prisma_1.default.vendorOnboarding.findUnique({
        where: { userId },
        select: { pricing: true },
    });
    return vendor?.pricing;
};
exports.getVendorPricing = getVendorPricing;
