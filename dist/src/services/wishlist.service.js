"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.getUserWishlist = exports.addToWishlist = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const addToWishlist = async (userId, productId) => {
    return await prisma_1.default.wishlistItem.create({
        data: { userId, productId },
        include: { product: true },
    });
};
exports.addToWishlist = addToWishlist;
const getUserWishlist = async (userId) => {
    return await prisma_1.default.wishlistItem.findMany({
        where: { userId },
        include: { product: true },
    });
};
exports.getUserWishlist = getUserWishlist;
const removeFromWishlist = async (userId, productId) => {
    return await prisma_1.default.wishlistItem.deleteMany({
        where: { userId, productId },
    });
};
exports.removeFromWishlist = removeFromWishlist;
