"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartQuantity = exports.removeFromCart = exports.getUserCart = exports.addToCart = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors"); // adjust path
const addToCart = async (userId, productId) => {
    // Step 1: Find product
    const product = await prisma_1.default.product.findUnique({
        where: { id: productId },
    });
    if (!product) {
        throw new errors_1.NotFoundError('Product not found');
    }
    if (product.approvalStatus !== client_1.ApprovalStatus.APPROVED) {
        throw new errors_1.ForbiddenError('Product is not approved for sale');
    }
    // Optional: Prevent duplicates
    const existingItem = await prisma_1.default.cartItem.findFirst({
        where: { userId, productId },
    });
    if (existingItem) {
        throw new errors_1.BadRequestError('Product already in cart');
    }
    // Step 2: Add to cart
    return await prisma_1.default.cartItem.create({
        data: { userId, productId },
        include: { product: true },
    });
};
exports.addToCart = addToCart;
const getUserCart = async (userId) => {
    // Step 1: Make sure user exists
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new errors_1.NotFoundError('User not found');
    }
    // Step 2: Fetch cart items with related product
    const cartItems = await prisma_1.default.cartItem.findMany({
        where: { userId },
        include: { product: true },
    });
    // Step 3: Filter out products that are not approved
    const approvedItems = cartItems.filter((item) => item.product?.approvalStatus === 'APPROVED');
    if (approvedItems.length === 0) {
        throw new errors_1.NotFoundError('No approved products in cart');
    }
    return approvedItems;
};
exports.getUserCart = getUserCart;
const removeFromCart = async (userId, productId) => {
    return await prisma_1.default.cartItem.deleteMany({
        where: { userId, productId },
    });
};
exports.removeFromCart = removeFromCart;
const updateCartQuantity = async (userId, productId, quantity) => {
    if (quantity <= 0) {
        await prisma_1.default.cartItem.deleteMany({
            where: { userId, productId },
        });
        return null;
    }
    // 1. Get product and cart item
    const [product, existingItem] = await Promise.all([
        prisma_1.default.product.findUnique({ where: { id: productId } }),
        prisma_1.default.cartItem.findFirst({ where: { userId, productId } }),
    ]);
    if (!product) {
        throw new errors_1.NotFoundError("Product not found");
    }
    if (!existingItem) {
        throw new errors_1.NotFoundError("Item not found in cart");
    }
    if (product.approvalStatus !== client_1.ApprovalStatus.APPROVED) {
        throw new errors_1.ForbiddenError("Product is not approved for sale");
    }
    if (quantity > product.qtyAvailable) {
        throw new errors_1.BadRequestError(`Only ${product.qtyAvailable} in stock`);
    }
    // 2. Update quantity
    return await prisma_1.default.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity },
        include: { product: true },
    });
};
exports.updateCartQuantity = updateCartQuantity;
