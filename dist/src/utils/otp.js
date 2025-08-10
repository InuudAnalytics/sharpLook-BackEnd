"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpExpiry = exports.generateOTP = void 0;
// src/utils/otp.ts
const generateOTP = (length = 6) => {
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
};
exports.generateOTP = generateOTP;
const otpExpiry = () => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
};
exports.otpExpiry = otpExpiry;
