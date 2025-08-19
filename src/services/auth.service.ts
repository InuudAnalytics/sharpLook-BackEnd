import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import prisma from "../config/prisma"
import { Role } from "@prisma/client"
import crypto from "crypto"
import { sendMail } from "../helpers/email.helper"
import {
  BaseLoginResponse,
  VendorLoginResponse,
  ClientLoginResponse,
} from "../types/auth.types";
import { generateReferralCode } from "../utils/referral";
import { createWallet, creditWallet } from "./wallet.service";

export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: Role,
  acceptedPersonalData: boolean,
  phone: string,
  referredByCode?: string
) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { phone }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.email === email && existingUser.phone === phone) {
      throw new Error("Email and phone number already in use");
    } else if (existingUser.email === email) {
      throw new Error("Email already in use");
    } else {
      throw new Error("Phone number already in use");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const referralCode = generateReferralCode();

  let creditWalletId: string | null = null;
  let referrerWalletId: string | null = null;

  const createdUser = await prisma.$transaction(async (tx) => {
    let referredById: string | undefined;

    if (referredByCode) {
      const referredByUser = await tx.user.findUnique({
        where: { referralCode: referredByCode },
        select: { id: true },
      });

      if (!referredByUser) {
        throw new Error("Invalid referral code.");
      }

      referredById = referredByUser.id;
    }

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        referralCode,
        acceptedPersonalData,
        ...(referredById && { referredById }),
      },
    });

    const wallet = await tx.wallet.create({
      data: {
        balance: 0,
        status: "ACTIVE",
        userId: user.id,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { walletId: wallet.id },
    });

    if (referredById) {
      await tx.referral.create({
        data: {
          referredById,
          referredUserId: user.id,
          amountEarned: 100,
        },
      });

      creditWalletId = wallet.id;

      const referrerWallet = await tx.wallet.findUnique({
        where: { userId: referredById },
        select: { id: true },
      });

      if (referrerWallet) {
        referrerWalletId = referrerWallet.id;
      }
    }

    return {
      ...user,
      wallet,
    };
  });

  if (creditWalletId) {
    await creditWallet(prisma, creditWalletId, 100);
  }

  if (referrerWalletId) {
    await creditWallet(prisma, referrerWalletId, 100);
  }

  return createdUser;
};





export const loginUser = async (email: string, password: string): Promise<BaseLoginResponse> => {
  const user = await prisma.user.findUnique({
  where: { email },
  include: {
    vendorOnboarding: true, 
    wallet: true,
  },
});
;
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user.id, role: user.role, walletId: user.wallet?.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return { token, user };
};

export const loginWithClientCheck = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

 const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
     // ✅ get vendor ID from the related record
  },
  process.env.JWT_SECRET!,
  { expiresIn: "7d" }
);
  let message: string | undefined;

  if (user.role === "CLIENT") {
    if (user.preferredLatitude == null || user.preferredLongitude == null) {
      message = "No Location";
    }
  }

  return { token, user, message };
};


export const loginWithVendorCheck = async (email: string, password: string): Promise<VendorLoginResponse> => {
   const user = await prisma.user.findUnique({
  where: { email },
  include: {
    vendorOnboarding: true, // 👈 this tells Prisma to load the related data
  },
});
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user.id, role: user.role}, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  const existingVendorProfile = await prisma.vendorOnboarding.findUnique({
  where: { userId: user.id },
});

  let vendorProfile = await prisma.vendorOnboarding.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      identityImage: "",
      serviceType:existingVendorProfile!.serviceType,
      specialties: [],
      portfolioImages: [],
    },
  });

  let message: string | undefined;
  if (!vendorProfile.businessName) {
    message = "Please complete your vendor profile (business Name required).";
  } else if (vendorProfile.latitude == null || vendorProfile.longitude == null) {
    message = "No Location";
  }

  return { token, user, vendorProfile, message };
};




export const resetPassword = async (email: string, token: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.resetToken !== token || user.resetTokenExp! < new Date()) {
    throw new Error("Invalid or expired token")
  }

  const hashed = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExp: null,
    },
  })
}



export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error("User not found")

  const token = crypto.randomBytes(32).toString("hex")
  const tokenExp = new Date(Date.now() + 1000 * 60 * 10)

  await prisma.user.update({
    where: { email },
    data: { resetToken: token, resetTokenExp: tokenExp },
  })

  await sendMail(
    email,
    "Password Reset Token",
    `<p>Use this token to reset your password: <b>${token}</b></p>`
  )
}




export const getUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      vendorOnboarding: true,
      clientBookings: true,
      vendorBookings: true,
      products: true,
      vendorAvailability: true,
      // promotions: true,
      vendorReviews: true,
      clientReviews: true,
      notifications: true,
      
    },
  });
};
