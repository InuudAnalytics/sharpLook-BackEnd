"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPaystackPayment = exports.initiatePaystackPayment = exports.handlePaystackWebhook = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const paystack_1 = require("../utils/paystack");
const wallet_service_1 = require("../services/wallet.service");
const client_1 = require("@prisma/client");
const handlePaystackWebhook = async (reference) => {
    try {
        const paymentData = await (0, paystack_1.verifyPayment)(reference);
        const email = paymentData.customer?.email;
        const amount = paymentData.amount / 100;
        console.log("Na transaction be this  ********************", paymentData);
        if (!email) {
            throw new Error("Email missing from payment");
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { wallet: true },
        });
        if (!user?.wallet) {
            throw new Error("User or wallet not found");
        }
        const transaction = await prisma_1.default.transaction.findUnique({
            where: { reference },
        });
        if (!transaction) {
            const message = `[Webhook] No transaction found for ${reference}`;
            console.error(message);
            return { success: false, message };
        }
        if (paymentData.status !== "success") {
            const message = `${paymentData.gateway_response}`;
            console.warn(message);
            return { success: false, message };
        }
        if (transaction.status === "paid") {
            const message = `Payment has already been verified , The refrence number is : ${reference}`;
            console.warn(message);
            return { success: true, status: 200, message };
        }
        // ✅ Credit wallet and mark transaction as successful
        await (0, wallet_service_1.creditWallet)(prisma_1.default, user.wallet.id, amount, "Wallet Funding");
        await prisma_1.default.transaction.update({
            where: { reference },
            data: { status: "SUCCESS" },
        });
        const message = `[Webhook] Wallet funded successfully: ${amount}`;
        // console.log(message);
        return { success: true, status: 200, message };
    }
    catch (error) {
        console.error(`[Webhook Error]`, error);
        return {
            success: false,
            message: error.message || "Unhandled error occurred",
        };
    }
};
exports.handlePaystackWebhook = handlePaystackWebhook;
const initiatePaystackPayment = async (userId, amount, paymentFor, // e.g. "BOOKING", "ORDER"
description = "Paystack Payment") => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
    });
    if (!user || !user.wallet)
        throw new Error("User or wallet not found");
    const paymentData = await (0, paystack_1.initializePayment)(user.email, amount);
    console.log("This is Payment Data", paymentData);
    const reference = paymentData.reference;
    await prisma_1.default.transaction.create({
        data: {
            walletId: user.wallet.id,
            amount,
            reference,
            description,
            status: "PENDING",
            type: client_1.TransactionType.DEBIT,
            paymentFor,
        },
    });
    return paymentData; // send authorization_url to frontend
};
exports.initiatePaystackPayment = initiatePaystackPayment;
const confirmPaystackPayment = async (reference) => {
    // First, fetch the transaction to check current status
    const existingTransaction = await prisma_1.default.transaction.findUnique({
        where: { reference },
    });
    if (!existingTransaction) {
        throw new Error("Transaction not found");
    }
    // If already paid, return early with a message or the existing transaction
    if (existingTransaction.status === "paid") {
        return { message: "Payment already verified", transaction: existingTransaction };
    }
    // Otherwise, verify payment
    const verification = await (0, paystack_1.verifyPayment)(reference);
    const status = verification.status === "success" ? "paid" : "failed";
    const updatedTransaction = await prisma_1.default.transaction.update({
        where: { reference },
        data: { status },
    });
    return updatedTransaction;
};
exports.confirmPaystackPayment = confirmPaystackPayment;
