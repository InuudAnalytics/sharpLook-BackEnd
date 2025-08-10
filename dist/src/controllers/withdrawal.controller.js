"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBanks = exports.resolveAccountController = exports.getAllWithdrawals = exports.getUserWithdrawals = exports.updateWithdrawalStatus = exports.requestWithdrawal = void 0;
const withdrawal_service_1 = require("../services/withdrawal.service");
const withdrawal_service_2 = require("../services/withdrawal.service");
const paystack_1 = require("../utils/paystack");
const requestWithdrawal = async (req, res) => {
    try {
        const { amount, bankAccountNumber, bankCode, resolvedAccountName } = req.body;
        const userId = req.user?.id || req.body.userId;
        if (!userId || !amount || !bankAccountNumber || !bankCode) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const result = await withdrawal_service_2.WithdrawalService.requestWithdrawal({
            userId,
            amount,
            bankAccountNumber,
            bankCode,
            resolvedAccountName,
        });
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("❌ Withdrawal error:", error);
        let message = "Withdrawal failed";
        // Custom Paystack or service-level messages
        if (error.response?.data?.message) {
            message = error.response.data.message;
        }
        else if (error.message) {
            message = error.message;
        }
        return res.status(500).json({ message });
    }
};
exports.requestWithdrawal = requestWithdrawal;
const updateWithdrawalStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated = await (0, withdrawal_service_1.updateWithdrawalStatusService)(id, status);
        res.status(200).json({ success: true, message: `Withdrawal ${status.toLowerCase()}`, data: updated });
    }
    catch (err) {
        next(err);
    }
};
exports.updateWithdrawalStatus = updateWithdrawalStatus;
const getUserWithdrawals = async (req, res, next) => {
    try {
        const withdrawals = await (0, withdrawal_service_1.getUserWithdrawalsService)(req.user.id);
        res.status(200).json({ success: true, data: withdrawals });
    }
    catch (err) {
        next(err);
    }
};
exports.getUserWithdrawals = getUserWithdrawals;
const getAllWithdrawals = async (req, res, next) => {
    try {
        const all = await (0, withdrawal_service_1.getAllWithdrawalsService)();
        res.status(200).json({ success: true, data: all });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllWithdrawals = getAllWithdrawals;
const resolveAccountController = async (req, res) => {
    try {
        const { bankAccountNumber, bankCode } = req.body;
        if (!bankAccountNumber || !bankCode) {
            return res.status(400).json({ message: "bankAccountNumber and bankCode are required" });
        }
        const accountDetails = await (0, withdrawal_service_2.resolveAccount)(bankAccountNumber, bankCode);
        return res.status(200).json({
            message: "Account resolved successfully",
            data: accountDetails,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
exports.resolveAccountController = resolveAccountController;
const getAllBanks = async (req, res) => {
    const banksList = await (0, paystack_1.getBanks)();
    res.status(200).json({
        success: true,
        message: "Banks List gotten Successfully",
        data: banksList
    });
};
exports.getAllBanks = getAllBanks;
