"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWalletFunding = exports.fundWallet = exports.walletTransactions = exports.getWalletDetails = void 0;
const wallet_service_1 = require("../services/wallet.service");
const payment_service_1 = require("../services/payment.service");
const prisma_1 = __importDefault(require("../config/prisma"));
// import { initializePayment  } from "../utils/paystack"
const getWalletDetails = async (req, res) => {
    try {
        // 1. Extract user ID
        const userId = req.user.id;
        // 2. Fetch wallet by user ID
        const wallet = await (0, wallet_service_1.getUserWallet)(userId);
        // 3. Handle wallet not found
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }
        // 4. Return wallet info
        return res.status(200).json({ success: true, wallet });
    }
    catch (error) {
        // 5. Handle unexpected error
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.getWalletDetails = getWalletDetails;
const walletTransactions = async (req, res) => {
    try {
        // 1. Extract user ID
        const userId = req.user.id;
        // 2. Fetch transactions from DB
        const transactions = await (0, wallet_service_1.getWalletTransactions)(userId);
        // 3. Return transaction list
        res.status(200).json(transactions);
    }
    catch (error) {
        // 4. Handle unexpected error
        console.log(error);
        res.status(500).json({ message: "An Error occurred" });
    }
};
exports.walletTransactions = walletTransactions;
const fundWallet = async (req, res) => {
    const userId = req.user.id;
    try {
        const { email, amount } = req.body;
        const paymentFor = "WALLET FUNDING";
        console.log(typeof amount);
        const payment = await (0, payment_service_1.initiatePaystackPayment)(userId, amount, paymentFor);
        console.log(payment);
        res.status(200).json({ message: "Initialized", data: payment });
    }
    catch (error) {
        const err = error;
        res.status(400).json({ error: err.message });
    }
};
exports.fundWallet = fundWallet;
const verifyWalletFunding = async (req, res) => {
    try {
        const { reference } = req.body;
        console.log("[verifyWalletFunding] Incoming request - Body:", req.body);
        if (!reference || typeof reference !== "string") {
            const message = "Missing or invalid reference";
            console.error("[verifyWalletFunding] Error:", message);
            return res.status(400).json({ success: false, message });
        }
        // Step 1: Confirm payment
        const transactionOrMessage = await (0, payment_service_1.confirmPaystackPayment)(reference);
        // Check if payment was already verified (if you return an object with a message)
        if ("message" in transactionOrMessage) {
            // Transaction was already paid, so just return this info without funding wallet again
            return res.status(200).json({
                success: true,
                message: transactionOrMessage.message,
                transaction: transactionOrMessage.transaction,
            });
        }
        const transaction = transactionOrMessage;
        if (!transaction || transaction.status !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed or not successful.",
            });
        }
        // Step 2: Fund wallet
        const walletId = transaction.walletId;
        const amount = transaction.amount;
        if (!walletId) {
            return res.status(400).json({
                success: false,
                message: "Transaction is not linked to a wallet.",
            });
        }
        await prisma_1.default.wallet.update({
            where: { id: walletId },
            data: {
                balance: { increment: amount },
            },
        });
        return res.status(200).json({
            success: true,
            message: "Wallet funded successfully",
            amount,
        });
    }
    catch (error) {
        console.error("[verifyWalletFunding] Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "An error occurred during wallet funding.",
            error: error.message,
        });
    }
};
exports.verifyWalletFunding = verifyWalletFunding;
