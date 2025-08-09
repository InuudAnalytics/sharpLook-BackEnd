// src/services/otp.service.ts
import prisma from "../config/prisma"
import { sendMail } from "../helpers/email.helper"
import { sendSmS } from "./sms.service"

export const sendOtpService = async (identifier: string) => {
  const fourDigitotp = Math.floor(1000 + Math.random() * 9000).toString();
  console.log(`✅ OTP Generated: ${fourDigitotp} | Length: ${fourDigitotp.length}`);

  if (identifier.includes("@")) {
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
  }
  // 📱 Otherwise treat as phone
  else {
    await sendSmS(identifier, Number(fourDigitotp));
  }

  console.log(`✅ OTP sent to ${identifier}: ${fourDigitotp}`);
};



export const verifyOtpService = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

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

  // Mark user as verified and clear OTP
  await prisma.user.update({
    where: { email },
    data: {
      isEmailVerified: true,
      isOtpVerified: true,
      otp: null,
      otpExpires: null,
    },
  });
};


