"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpService = exports.sendOtpService = void 0;
// src/services/otp.service.ts
const prisma_1 = __importDefault(require("../config/prisma"));
const email_helper_1 = require("../helpers/email.helper");
const sms_service_1 = require("./sms.service");
const sendOtpService = async (identifier) => {
    const fourDigitotp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`✅ OTP Generated: ${fourDigitotp} | Length: ${fourDigitotp.length}`);
    if (identifier.includes("@")) {
        await (0, email_helper_1.sendMail)(identifier, "🧾 Your Sharplook OTP Code", `
        <div style="font-family: 'Helvetica Neue', sans-serif; background-color: #f4f4f5; padding: 24px; border-radius: 12px; color: #111827;">
          <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 8px;">Welcome to <span style="color: #3b82f6;">Sharplook</span> 👔</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your one-time passcode is:</p>
          <p style="font-size: 30px; font-weight: 700; color: #1e40af; margin: 16px 0; letter-spacing: 4px;">
            ${fourDigitotp}
          </p>
          <p style="font-size: 14px; color: #4b5563;">This code will expire in <strong>10 minutes</strong>.</p>
        </div>
      `);
    }
    // 📱 Otherwise treat as phone
    else {
        await (0, sms_service_1.sendSmS)(identifier, Number(fourDigitotp));
    }
    console.log(`✅ OTP sent to ${identifier}: ${fourDigitotp}`);
};
exports.sendOtpService = sendOtpService;
const verifyOtpService = async (email, otp) => {
    const user = await prisma_1.default.user.findUnique({
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
    await prisma_1.default.user.update({
        where: { email },
        data: {
            isEmailVerified: true,
            isOtpVerified: true,
            otp: null,
            otpExpires: null,
        },
    });
};
exports.verifyOtpService = verifyOtpService;
