"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.requestPasswordReset = exports.resetPassword = exports.loginWithVendorCheck = exports.loginWithClientCheck = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const email_helper_1 = require("../helpers/email.helper");
const referral_1 = require("../utils/referral");
const wallet_service_1 = require("./wallet.service");
const registerUser = async (email, password, firstName, lastName, role, acceptedPersonalData, phone, referredByCode) => {
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error("Email already in use");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const referralCode = (0, referral_1.generateReferralCode)();
    // Prepare variables for use outside the transaction
    let creditWalletId = null;
    let referrerWalletId = null;
    const createdUser = await prisma_1.default.$transaction(async (tx) => {
        let referredById;
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
        // Step 1: Create the user
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
        // Step 2: Create wallet
        const wallet = await tx.wallet.create({
            data: {
                balance: 0,
                status: "ACTIVE",
                userId: user.id,
            },
        });
        // Step 3: Update user with walletId
        await tx.user.update({
            where: { id: user.id },
            data: { walletId: wallet.id },
        });
        // Step 4: Handle referral record only (no wallet credit here)
        if (referredById) {
            await tx.referral.create({
                data: {
                    referredById,
                    referredUserId: user.id,
                    amountEarned: 100,
                },
            });
            // Store IDs for wallet credit outside the transaction
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
    // ✅ OUTSIDE the transaction: Perform wallet credits
    if (creditWalletId) {
        await (0, wallet_service_1.creditWallet)(prisma_1.default, creditWalletId, 100);
    }
    if (referrerWalletId) {
        await (0, wallet_service_1.creditWallet)(prisma_1.default, referrerWalletId, 100);
    }
    return createdUser;
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await prisma_1.default.user.findUnique({
        where: { email },
        include: {
            vendorOnboarding: true,
            wallet: true,
        },
    });
    ;
    if (!user)
        throw new Error("Invalid credentials");
    const match = await bcryptjs_1.default.compare(password, user.password);
    if (!match)
        throw new Error("Invalid credentials");
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, walletId: user.wallet?.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    return { token, user };
};
exports.loginUser = loginUser;
const loginWithClientCheck = async (email, password) => {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("Invalid credentials");
    const match = await bcryptjs_1.default.compare(password, user.password);
    if (!match)
        throw new Error("Invalid credentials");
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        // ✅ get vendor ID from the related record
    }, process.env.JWT_SECRET, { expiresIn: "7d" });
    let message;
    if (user.role === "CLIENT") {
        if (user.preferredLatitude == null || user.preferredLongitude == null) {
            message = "No Location";
        }
    }
    return { token, user, message };
};
exports.loginWithClientCheck = loginWithClientCheck;
const loginWithVendorCheck = async (email, password) => {
    const user = await prisma_1.default.user.findUnique({
        where: { email },
        include: {
            vendorOnboarding: true, // 👈 this tells Prisma to load the related data
        },
    });
    if (!user)
        throw new Error("Invalid credentials");
    const match = await bcryptjs_1.default.compare(password, user.password);
    if (!match)
        throw new Error("Invalid credentials");
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    const existingVendorProfile = await prisma_1.default.vendorOnboarding.findUnique({
        where: { userId: user.id },
    });
    let vendorProfile = await prisma_1.default.vendorOnboarding.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            identityImage: "",
            serviceType: existingVendorProfile.serviceType,
            specialties: [],
            portfolioImages: [],
        },
    });
    let message;
    if (!vendorProfile.businessName) {
        message = "Please complete your vendor profile (business Name required).";
    }
    else if (vendorProfile.latitude == null || vendorProfile.longitude == null) {
        message = "No Location";
    }
    return { token, user, vendorProfile, message };
};
exports.loginWithVendorCheck = loginWithVendorCheck;
const resetPassword = async (email, token, newPassword) => {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || user.resetToken !== token || user.resetTokenExp < new Date()) {
        throw new Error("Invalid or expired token");
    }
    const hashed = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.default.user.update({
        where: { email },
        data: {
            password: hashed,
            resetToken: null,
            resetTokenExp: null,
        },
    });
};
exports.resetPassword = resetPassword;
const requestPasswordReset = async (email) => {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("User not found");
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const tokenExp = new Date(Date.now() + 1000 * 60 * 10);
    await prisma_1.default.user.update({
        where: { email },
        data: { resetToken: token, resetTokenExp: tokenExp },
    });
    await (0, email_helper_1.sendMail)(email, "Password Reset Token", `<p>Use this token to reset your password: <b>${token}</b></p>`);
};
exports.requestPasswordReset = requestPasswordReset;
const getUserById = async (userId) => {
    return await prisma_1.default.user.findUnique({
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
exports.getUserById = getUserById;
