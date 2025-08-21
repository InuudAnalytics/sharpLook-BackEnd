import prisma from "../config/prisma";
import { initializePayment } from "../utils/paystack";
import { Prisma, TransactionType } from "@prisma/client";

// Helper to generate unique reference for referrals
const generateReferralReference = (): string =>
  `REFERRAL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

export const initiateWalletFunding = async (userId: string, amount: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user || !user.wallet) {
    throw new Error("User or wallet not found");
  }

  const paymentData = await initializePayment(user.email, amount);
  const reference = paymentData.reference;

  await prisma.transaction.create({
    data: {
      walletId: user.wallet.id,
      amount,
      reference,
      description: "Wallet Funding",
      status: "PENDING",
      type: TransactionType.CREDIT,
    },
  });

  return paymentData; // send to frontend
};

// Create a new wallet for a user
export const createWallet = async (userId: string) => {
  return await prisma.wallet.create({
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

// Credit wallet and log CREDIT transaction
// If no reference is provided, generate one (assumed referral)
export const creditWallet = async (
  tx: Prisma.TransactionClient,
  walletId: string,
  amount: number,
  description = "Referral Bonus",
  reference?: string
) => {
  const transactionReference = reference ?? generateReferralReference();

  return await tx.wallet.update({
    where: { id: walletId },
    data: {
      balance: { increment: amount },
      transactions: {
        create: {
          amount,
          type: TransactionType.CREDIT,
          description,
          status: "CREDIT",
          reference: transactionReference,
        },
      },
    },
  });
};

// Debit wallet and log DEBIT transaction
// Reference must be provided explicitly
export const debitWallet = async (
  walletId: string,
  amount: number,
  description = "Debit",
  reference: string
) => {
  return await prisma.wallet.update({
    where: { id: walletId },
    data: {
      balance: { decrement: amount },
      transactions: {
        create: {
          amount,
          type: TransactionType.DEBIT,
          description,
          status: "PENDING",
          reference,
        },
      },
    },
  });
};

// Get wallet with all transactions for a user
export const getUserWallet = async (userId: string) => {
  return await prisma.wallet.findUnique({
    where: { userId },
    include: { transactions: true },
  });
};

// Get transactions for user's wallet (most recent first)
export const getWalletTransactions = async (userId: string) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!wallet) return [];

  return await prisma.transaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
  });
};
