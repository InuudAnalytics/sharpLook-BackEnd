"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEarnings = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const calculateEarnings = async (vendorId) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [daily, weekly, monthly] = await Promise.all([
        prisma_1.default.booking.aggregate({
            _sum: { price: true },
            where: {
                vendorId,
                status: "COMPLETED",
                createdAt: { gte: startOfDay },
            },
        }),
        prisma_1.default.booking.aggregate({
            _sum: { price: true },
            where: {
                vendorId,
                status: "COMPLETED",
                createdAt: { gte: startOfWeek },
            },
        }),
        prisma_1.default.booking.aggregate({
            _sum: { price: true },
            where: {
                vendorId,
                status: "COMPLETED",
                createdAt: { gte: startOfMonth },
            },
        }),
    ]);
    return {
        dailyEarnings: daily._sum.price || 0,
        weeklyEarnings: weekly._sum.price || 0,
        monthlyEarnings: monthly._sum.price || 0,
    };
};
exports.calculateEarnings = calculateEarnings;
