"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpService = exports.sendOtpService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const email_helper_1 = require("../helpers/email.helper");
const sms_service_1 = require("./sms.service");
const sendOtpService = async (identifier) => {
    const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
    const sixDigitOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    let user;
    if (identifier.includes("@")) {
        user = await prisma_1.default.user.findUnique({ where: { email: identifier } });
        if (!user)
            throw new Error("No account found with this email.");
        if (user.otpLastSentAt &&
            Date.now() - new Date(user.otpLastSentAt).getTime() < RESEND_COOLDOWN_MS) {
            throw new Error("OTP already sent. Please wait a minute before requesting again.");
        }
        await prisma_1.default.user.update({
            where: { email: identifier },
            data: {
                otp: sixDigitOtp,
                otpExpires,
                otpAttemptCount: 0,
                otpLockUntil: null,
                otpLastSentAt: new Date(),
            },
        });
        await (0, email_helper_1.sendMail)(identifier, "🧾 Your Sharplook OTP Code", `
        <div style="font-family: 'Helvetica Neue', sans-serif; background-color: #f4f4f5; padding: 24px; border-radius: 12px; color: #111827;">
          <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 8px;">Welcome to <span style="color: #3b82f6;">Sharplook</span> 👔</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your one-time passcode is:</p>
          <p style="font-size: 30px; font-weight: 700; color: #1e40af; margin: 16px 0; letter-spacing: 4px;">
            ${sixDigitOtp}
          </p>
          <p style="font-size: 14px; color: #4b5563;">This code will expire in <strong>10 minutes</strong>.</p>
        </div>
      `);
    }
    else {
        user = await prisma_1.default.user.findFirst({ where: { phone: identifier } });
        if (!user) {
            throw new Error("No account found with this phone number. Please use the number you registered with.");
        }
        if (user.otpLastSentAt &&
            Date.now() - new Date(user.otpLastSentAt).getTime() < RESEND_COOLDOWN_MS) {
            throw new Error("OTP already sent. Please wait a minute before requesting again.");
        }
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                otp: sixDigitOtp,
                otpExpires,
                otpAttemptCount: 0,
                otpLockUntil: null,
                otpLastSentAt: new Date(),
            },
        });
        await (0, sms_service_1.sendSmS)(identifier, Number(sixDigitOtp));
    }
    console.log(`✅ OTP sent to ${identifier}: ${sixDigitOtp}`);
};
exports.sendOtpService = sendOtpService;
const MAX_OTP_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const verifyOtpService = async (identifier, otp) => {
    if (!identifier || !otp)
        throw new Error("Identifier and OTP are required");
    const isEmail = identifier.includes("@");
    const user = isEmail
        ? await prisma_1.default.user.findUnique({ where: { email: identifier } })
        : await prisma_1.default.user.findFirst({ where: { phone: identifier } });
    if (!user)
        throw new Error("User not found");
    if (!user.otp || !user.otpExpires)
        throw new Error("OTP not found or expired");
    // ⛔ Check if user is locked out
    if (user.otpLockUntil && new Date(user.otpLockUntil) > new Date()) {
        const minutes = Math.ceil((new Date(user.otpLockUntil).getTime() - Date.now()) / 60000);
        throw new Error(`Too many incorrect attempts. Try again in ${minutes} minutes.`);
    }
    // ❌ Check if expired
    if (user.otpExpires < new Date())
        throw new Error("OTP has expired");
    if (user.otp !== otp) {
        const newAttemptCount = (user.otpAttemptCount || 0) + 1;
        const updateData = {
            otpAttemptCount: newAttemptCount,
            otpLastAttemptAt: new Date(),
        };
        // 🔒 Lock out if max attempts exceeded
        if (newAttemptCount >= MAX_OTP_ATTEMPTS) {
            updateData.otpLockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        }
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: updateData,
        });
        throw new Error("Invalid OTP");
    }
    // ✅ OTP is correct
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: isEmail ? true : user.isEmailVerified,
            phoneVerified: !isEmail ? true : user.phoneVerified,
            isOtpVerified: true,
            otp: null,
            otpExpires: null,
            otpAttemptCount: 0,
            otpLockUntil: null,
            otpLastAttemptAt: null,
        },
    });
    return { success: true, message: "OTP verified successfully" };
};
exports.verifyOtpService = verifyOtpService;
