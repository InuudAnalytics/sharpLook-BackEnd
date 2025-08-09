// src/services/otp.service.ts
import { email } from "zod";
import prisma from "../config/prisma"
import { sendMail } from "../helpers/email.helper"
import { sendSmS } from "./sms.service"

export const sendOtpService = async (identifier: string) => {
  const fourDigitotp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  let user;

  if (identifier.includes("@")) {
    // EMAIL FLOW — only send OTP if user exists
    user = await prisma.user.findUnique({ where: { email: identifier } });

    if (!user) {
      throw new Error("No account found with this email.");
    }

    await prisma.user.update({
      where: { email: identifier },
      data: { otp: fourDigitotp, otpExpires },
    });

    await sendMail(
      identifier,
      "🧾 Your Sharplook OTP Code",
      `
        <div style="font-family: 'Helvetica Neue', sans-serif; background-color: #f4f4f5; padding: 24px; border-radius: 12px; color: #111827;">
          <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 8px;">Welcome to <span style="color: #3b82f6;">Sharplook</span> 👔</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your one-time passcode is:</p>
          <p style="font-size: 30px; font-weight: 700; color: #1e40af; margin: 16px 0; letter-spacing: 4px;">
            ${fourDigitotp}
          </p>
          <p style="font-size: 14px; color: #4b5563;">This code will expire in <strong>10 minutes</strong>.</p>
        </div>
      `
    );
  } else {
    // PHONE FLOW — only update OTP if user exists
    user = await prisma.user.findFirst({ where: { phone: identifier } });

    if (!user) {
      throw new Error("No account found with this phone number., Pls use the number you registered with");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otp: fourDigitotp, otpExpires },
    });

    await sendSmS(identifier, Number(fourDigitotp));
  }

  console.log(`✅ OTP sent to ${identifier}: ${fourDigitotp}`);
};


export const verifyOtpService = async (identifier: string, otp: string) => {
  if (!identifier || !otp) {
    throw new Error("Identifier and OTP are required");
  }
 
  let user;

  const isEmail = identifier.includes("@");

  if (isEmail) {
    // Ensure it's a valid email format (basic check)
    user = await prisma.user.findUnique({ where: { email: identifier } });
  } else {
    // Treat it as a phone number
    user = await prisma.user.findFirst({ where: { phone: identifier } });
  }

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.otp || !user.otpExpires) {
    throw new Error("OTP not found or expired");
  }

  if (user.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  if (user.otpExpires < new Date()) {
    throw new Error("OTP has expired");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: isEmail ? true : user.isEmailVerified,
      phoneVerified: !isEmail ? true : user.phoneVerified,
      isOtpVerified: true,
      otp: null,
      otpExpires: null,
    },
  });

  return { success: true, message: "OTP verified successfully" };
};




