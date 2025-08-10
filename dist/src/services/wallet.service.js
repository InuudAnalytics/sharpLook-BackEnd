"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletTransactions = exports.getUserWallet = exports.debitWallet = exports.creditWallet = exports.createWallet = exports.initiateWalletFunding = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const paystack_1 = require("../utils/paystack");
const client_1 = require("@prisma/client");
// Helper to generate unique reference for referrals
const generateReferralReference = () => `REFERRAL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
const initiateWalletFunding = async (userId, amount) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
    });
    if (!user || !user.wallet) {
        throw new Error("User or wallet not found");
    }
    const paymentData = await (0, paystack_1.initializePayment)(user.email, amount);
    const reference = paymentData.reference;
    await prisma_1.default.transaction.create({
        data: {
            walletId: user.wallet.id,
            amount,
            reference,
            description: "Wallet Funding",
            status: "PENDING",
            type: client_1.TransactionType.CREDIT,
        },
    });
    return paymentData; // send to frontend
};
exports.initiateWalletFunding = initiateWalletFunding;
// Create a new wallet for a user
const createWallet = async (userId) => {
    return await prisma_1.default.wallet.create({
        data: {
            balance: 0,
            status: "ACTIVE",
            likes: {
                create: [],
            },
            user: {
                connect: { id: userId },
            },
        },
    });
};
exports.createWallet = createWallet;
// Credit wallet and log CREDIT transaction
// If no reference is provided, generate one (assumed referral)
const creditWallet = async (tx, walletId, amount, description = "Referral Bonus", reference) => {
    const transactionReference = reference ?? generateReferralReference();
    return await tx.wallet.update({
        where: { id: walletId },
        data: {
            balance: { increment: amount },
            transactions: {
                create: {
                    amount,
                    type: client_1.TransactionType.CREDIT,
                    description,
                    status: "PENDING",
                    reference: transactionReference,
                },
            },
        },
    });
};
exports.creditWallet = creditWallet;
// Debit wallet and log DEBIT transaction
// Reference must be provided explicitly
const debitWallet = async (walletId, amount, description = "Debit", reference) => {
    return await prisma_1.default.wallet.update({
        where: { id: walletId },
        data: {
            balance: { decrement: amount },
            transactions: {
                create: {
                    amount,
                    type: client_1.TransactionType.DEBIT,
                    description,
                    status: "PENDING",
                    reference,
                },
            },
        },
    });
};
exports.debitWallet = debitWallet;
// Get wallet with all transactions for a user
const getUserWallet = async (userId) => {
    return await prisma_1.default.wallet.findUnique({
        where: { userId },
        include: { transactions: true },
    });
};
exports.getUserWallet = getUserWallet;
// Get transactions for user's wallet (most recent first)
const getWalletTransactions = async (userId) => {
    const wallet = await prisma_1.default.wallet.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!wallet)
        return [];
    return await prisma_1.default.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
    });
};
exports.getWalletTransactions = getWalletTransactions;
