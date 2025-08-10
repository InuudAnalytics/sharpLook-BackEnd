"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeCreateVendorCommission = maybeCreateVendorCommission;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Automatically creates a VendorCommissionSetting for HOME_SERVICE vendors.
 */
async function maybeCreateVendorCommission(userId) {
    const onboarding = await prisma.vendorOnboarding.findUnique({
        where: { userId },
    });
    if (!onboarding) {
        console.warn(`⚠️ No VendorOnboarding found for user: ${userId}`);
        return;
    }
    if (onboarding.serviceType !== client_1.ServiceType.HOME_SERVICE) {
        console.log(`ℹ️ Skipped vendor ${userId} — not a HOME_SERVICE`);
        return;
    }
    const existing = await prisma.vendorCommissionSetting.findUnique({
        where: { userId },
    });
    if (!existing) {
        await prisma.vendorCommissionSetting.create({
            data: {
                userId,
                commissionRate: 0.1,
                deductionStart: client_1.DeductionStartOption.AFTER_FIRST_WEEK,
            },
        });
        console.log(`✅ Commission setting created for vendor ${userId}`);
    }
    else {
        console.log(`ℹ️ Commission already set for vendor ${userId}`);
    }
}
