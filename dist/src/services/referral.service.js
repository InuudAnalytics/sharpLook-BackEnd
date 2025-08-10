"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferralAnalytics = exports.getUserReferrals = void 0;
// services/referral.service.ts
const prisma_1 = __importDefault(require("../config/prisma"));
// export const trackReferral = async (referredById: string, referredUserId: string) => {
//   return await prisma.referral.create({
//     data: {
//       referredById,
//       referredUserId,
//       amountEarned
//     }
//   });
// };
const getUserReferrals = async (userId) => {
    return await prisma_1.default.referral.findMany({
        where: { referredById: userId },
        include: {
            referredUser: true
        }
    });
};
exports.getUserReferrals = getUserReferrals;
const getReferralAnalytics = async (userId) => {
    const referrals = await prisma_1.default.referral.findMany({
        where: { referredById: userId },
        select: {
            amountEarned: true,
        },
    });
    const totalReferrals = referrals.length;
    const totalEarned = referrals.reduce((sum, r) => sum + r.amountEarned, 0);
    return { totalReferrals, totalEarned };
};
exports.getReferralAnalytics = getReferralAnalytics;
