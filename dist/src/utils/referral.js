"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = void 0;
const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); // Example: '4JD8GT'
};
exports.generateReferralCode = generateReferralCode;
