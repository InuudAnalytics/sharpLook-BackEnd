"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorOrderDisputeStatus = exports.getAllVendorOrderDisputes = exports.createVendorOrderDispute = exports.updateDisputeStatus = exports.getAllDisputes = exports.createDispute = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createDispute = async (bookingId, raisedById, reason, imageUrl) => {
    return await prisma_1.default.dispute.create({
        data: {
            bookingId,
            raisedById,
            reason,
            imageUrl,
        },
    });
};
exports.createDispute = createDispute;
const getAllDisputes = async () => {
    return await prisma_1.default.dispute.findMany({
        include: {
            raisedBy: {
                select: { firstName: true, lastName: true, role: true },
            },
            booking: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllDisputes = getAllDisputes;
const updateDisputeStatus = async (disputeId, status, resolution) => {
    return await prisma_1.default.dispute.update({
        where: { id: disputeId },
        data: { status, resolution },
    });
};
exports.updateDisputeStatus = updateDisputeStatus;
const createVendorOrderDispute = async (vendorOrderIds, // now an array
raisedById, reason, disputeImage) => {
    // Check if any of these already have disputes
    const existingDisputes = await prisma_1.default.vendorOrderDispute.findMany({
        where: {
            vendorOrderId: { in: vendorOrderIds },
        },
        select: { vendorOrderId: true },
    });
    if (existingDisputes.length > 0) {
        const disputedIds = existingDisputes.map(d => d.vendorOrderId);
        throw new Error(`A dispute has already been raised for these vendor orders: ${disputedIds.join(", ")}`);
    }
    // Create disputes for all IDs in parallel
    const disputes = await prisma_1.default.$transaction(vendorOrderIds.map(id => prisma_1.default.vendorOrderDispute.create({
        data: {
            vendorOrderId: id,
            raisedById,
            reason,
            disputeImage,
        },
    })));
    // Update vendor orders to mark dispute
    await prisma_1.default.vendorOrder.updateMany({
        where: { id: { in: vendorOrderIds } },
        data: {
            hasDispute: true,
            disputeStatus: "PENDING",
        },
    });
    return disputes;
};
exports.createVendorOrderDispute = createVendorOrderDispute;
const getAllVendorOrderDisputes = async () => {
    return await prisma_1.default.vendorOrderDispute.findMany({
        include: {
            raisedBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    email: true,
                },
            },
            vendorOrder: {
                select: {
                    id: true,
                    total: true,
                    status: true,
                    // add other vendorOrder fields you want
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllVendorOrderDisputes = getAllVendorOrderDisputes;
const updateVendorOrderDisputeStatus = async (disputeId, status, resolution) => {
    const dispute = await prisma_1.default.vendorOrderDispute.findUnique({
        where: { id: disputeId },
        include: {
            vendorOrder: {
                include: {
                    order: true,
                },
            },
        },
    });
    if (!dispute)
        throw new Error("Dispute not found");
    const vendorOrder = dispute.vendorOrder;
    const order = vendorOrder.order;
    await prisma_1.default.$transaction(async (tx) => {
        // ✅ Handle resolution actions if status is RESOLVED
        if (status === "RESOLVED") {
            if (resolution === "REFUND_TO_CLIENT") {
                const clientWallet = await tx.wallet.findUnique({
                    where: { userId: order.userId },
                });
                if (!clientWallet)
                    throw new Error("Client wallet not found");
                await tx.wallet.update({
                    where: { id: clientWallet.id },
                    data: {
                        balance: { increment: vendorOrder.total },
                    },
                });
                await tx.transaction.create({
                    data: {
                        amount: vendorOrder.total,
                        type: "REFUND",
                        reference: `REFUND-${vendorOrder.id}`,
                        description: `Refund due to dispute resolution`,
                        walletId: clientWallet.id,
                        status: "SUCCESS",
                    },
                });
                await tx.vendorOrder.update({
                    where: { id: vendorOrder.id },
                    data: {
                        paidOut: false,
                        status: "DELIVERED",
                    },
                });
            }
            if (resolution === "PAY_VENDOR") {
                const vendorWallet = await tx.wallet.findUnique({
                    where: { userId: vendorOrder.vendorId },
                });
                if (!vendorWallet)
                    throw new Error("Vendor wallet not found");
                await tx.wallet.update({
                    where: { id: vendorWallet.id },
                    data: {
                        balance: { increment: vendorOrder.total },
                    },
                });
                await tx.transaction.create({
                    data: {
                        amount: vendorOrder.total,
                        type: "CREDIT",
                        reference: `ORDER-PAYOUT-${vendorOrder.id}`,
                        description: `Vendor payout after dispute`,
                        walletId: vendorWallet.id,
                        status: "SUCCESS",
                    },
                });
                await tx.vendorOrder.update({
                    where: { id: vendorOrder.id },
                    data: {
                        paidOut: true,
                        status: "DELIVERED",
                    },
                });
            }
        }
        // ✅ Update dispute status and vendor order flags
        await tx.vendorOrderDispute.update({
            where: { id: disputeId },
            data: {
                status,
                resolution,
                resolvedAt: new Date(),
            },
        });
        await tx.vendorOrder.update({
            where: { id: vendorOrder.id },
            data: {
                disputeStatus: status,
                hasDispute: false,
            },
        });
    });
    return { message: `Dispute ${status.toLowerCase()} and resolved.` };
};
exports.updateVendorOrderDisputeStatus = updateVendorOrderDisputeStatus;
