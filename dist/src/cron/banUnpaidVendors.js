"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const node_cron_1 = __importDefault(require("node-cron"));
const prisma = new client_1.PrismaClient();
const banUnpaidInShopVendors = async () => {
    const now = new Date();
    try {
        const unpaidVendors = await prisma.vendorSubscription.findMany({
            where: {
                serviceType: client_1.ServiceType.IN_SHOP,
                OR: [
                    { isPaid: false },
                    { expiresAt: { lt: now } }
                ],
                user: {
                    isBanned: false
                }
            },
            include: {
                user: true
            }
        });
        if (unpaidVendors.length === 0) {
            console.log('✅ No unpaid IN_SHOP vendors to ban today.');
            return;
        }
        for (const subscription of unpaidVendors) {
            await prisma.user.update({
                where: { id: subscription.userId },
                data: {
                    isBanned: true,
                    notes: 'Auto-banned due to unpaid IN_SHOP subscription'
                }
            });
            console.log(`🚫 User ${subscription.user.email} has been banned.`);
        }
    }
    catch (error) {
        console.error('🚨 Error banning unpaid vendors:', error);
    }
};
// ⏰ Run daily at 00:00
node_cron_1.default.schedule('0 0 * * *', () => {
    console.log('🔁 Running daily unpaid vendor ban check...');
    banUnpaidInShopVendors();
});
// 👇 Optional: run once immediately on script start
banUnpaidInShopVendors();
