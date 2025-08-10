"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markVendorAsPaid = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const markVendorAsPaid = async (userId, planName, amount) => {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await prisma.vendorSubscription.update({
        where: { userId },
        data: {
            isPaid: true,
            paidAt: now,
            expiresAt: nextMonth,
            planName,
            amount,
            updatedAt: new Date(),
        },
    });
};
exports.markVendorAsPaid = markVendorAsPaid;
