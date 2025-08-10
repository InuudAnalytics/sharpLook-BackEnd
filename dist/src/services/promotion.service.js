"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePromotionStatus = exports.getActivePromotions = exports.getVendorPromotions = exports.createPromotion = void 0;
// src/services/promotion.service.ts
const prisma_1 = __importDefault(require("../config/prisma"));
const createPromotion = async (vendorId, title, description, discountPercentage, startDate, endDate) => {
    return await prisma_1.default.promotion.create({
        data: {
            vendorId,
            title,
            description,
            discountPercentage,
            startDate,
            endDate,
        },
    });
};
exports.createPromotion = createPromotion;
const getVendorPromotions = async (vendorId) => {
    return await prisma_1.default.promotion.findMany({
        where: { vendorId },
        orderBy: { createdAt: "desc" },
    });
};
exports.getVendorPromotions = getVendorPromotions;
const getActivePromotions = async () => {
    const now = new Date();
    return await prisma_1.default.promotion.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
        },
        include: { vendor: true },
    });
};
exports.getActivePromotions = getActivePromotions;
const togglePromotionStatus = async (promotionId, isActive) => {
    return await prisma_1.default.promotion.update({
        where: { id: promotionId },
        data: { isActive },
    });
};
exports.togglePromotionStatus = togglePromotionStatus;
