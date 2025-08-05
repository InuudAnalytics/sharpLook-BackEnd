import prisma from "../config/prisma";

import {
  createTransferRecipient,
  sendTransfer,
} from "../utils/paystack"
import { WithdrawalStatus } from "@prisma/client";
import axios from "axios";
import { debitWallet } from "./wallet.service";


export const generateReferralReference = (): string => {
  // Example: REF-20250801-8F4C2A7B (prefix + date + random hex)
  const prefix = "REF";
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // e.g., 20250801
  const randomPart = Math.random().toString(16).substr(2, 8).toUpperCase();

  return `${prefix}-${datePart}-${randomPart}`;
};


const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
interface WithdrawalRequestInput {
  userId: string;
  amount: number;
  reason?: string;
  bankAccountNumber: string;
  bankCode: string;
  accountName?: string; 
  resolvedAccountName: string
}

export class WithdrawalService {
  static async requestWithdrawal(input: WithdrawalRequestInput) {
    const {
      userId,
      amount,
      reason = "Wallet Withdrawal",
      bankAccountNumber,
      bankCode,
      resolvedAccountName,
    } = input;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const vendorCommission = await prisma.vendorCommissionSetting.findUnique({ where: { userId } });
    let platformFee = 0;

    if (vendorCommission) {
      const now = new Date();
      const timeElapsed = now.getTime() - user.createdAt.getTime();
      const shouldDeduct = {
        AFTER_FIRST_WEEK: 7,
        AFTER_SECOND_WEEK: 14,
        AFTER_FIRST_MONTH: 30,
      }[vendorCommission.deductionStart] ?? 0;

      if (timeElapsed >= shouldDeduct * 24 * 60 * 60 * 1000) {
        platformFee = amount * vendorCommission.commissionRate;
      }
    }

    const payoutAmount = amount - platformFee;
    if (payoutAmount <= 0) throw new Error("Payout too small after fees.");

    const recipientCode = await createTransferRecipient(
      resolvedAccountName,
      bankAccountNumber,
      bankCode
    );

    await debitWallet(wallet.id, payoutAmount, reason, generateReferralReference());

    let transfer: any;
    let transferError = null;

    try {
      transfer = await sendTransfer(payoutAmount, recipientCode, reason, { userId });
    } catch (err: any) {
      transferError = err;

      console.error("❌ Transfer error:", err?.response?.data || err.message || err);

      // fallback transfer data if timeout or 5xx error
      transfer = {
        reference: `failed-${Date.now()}`,
        status: 'pending',
        reason: 'Transfer initiated but failed or timed out',
      };
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: payoutAmount,
        reason,
        method: "paystack",
        status:
          transfer.status === "success"
            ? WithdrawalStatus.PAID
            : WithdrawalStatus.PENDING,
        metadata: {
          originalAmount: amount,
          platformFee,
          transferDetails: transfer,
          transferError: transferError?.response?.data || null,
        },
      },
    });

    return {

      
      message:
        transfer.status === "success"
          ? "Withdrawal successful"
          : "Withdrawal is being processed",
      withdrawal,
      paystackReference: transfer.reference,
      transferStatus: transfer.status,
    };
  }
}






export const requestWithdrawalService = async (userId: string, amount: number, reason: string, method: string, metadata: any) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  // Lock funds
  await prisma.wallet.update({
    where: { userId },
    data: {
      balance: { decrement: amount },
    },
  });

  // Create withdrawal
  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      userId,
      amount,
      reason,
      method,
      metadata,
      status: "PENDING",
    },
  });

  return withdrawal;
};

export const updateWithdrawalStatusService = async (id: string, status: "APPROVED" | "REJECTED") => {
  const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });

  if (!withdrawal) throw new Error("Withdrawal not found");
  if (withdrawal.status !== "PENDING") throw new Error("Withdrawal already processed");

  if (status === "REJECTED") {
    await prisma.wallet.update({
      where: { userId: withdrawal.userId },
      data: {
        balance: { increment: withdrawal.amount },
      },
    });
  }

  const updated = await prisma.withdrawalRequest.update({
    where: { id },
    data: { status },
  });

  return updated;
};

export const getUserWithdrawalsService = async (userId: string) => {
  return await prisma.withdrawalRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getAllWithdrawalsService = async () => {
  return await prisma.withdrawalRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
};


export const resolveAccount = async (accountNumber: string, bankCode: string) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    if (!response.data.status) {
      throw new Error(response.data.message || "Failed to resolve account");
    }

    // This returns something like { account_name: "John Doe", account_number: "1234567890" }
    return response.data.data;
  } catch (error: any) {
    console.error("Paystack resolve account error:", error.response?.data || error.message);
    throw new Error("Failed to resolve bank account. Please verify the details.");
  }
};