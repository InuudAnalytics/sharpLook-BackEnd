"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMultipleCartItems = exports.removeFromCart = exports.getUserCart = exports.addToCart = void 0;
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
const updateMultipleCartItems = async (userId, updates) => {
    const productIds = updates.map((item) => item.productId);
    // Fetch all relevant products and cart items
    const [products, cartItems] = await Promise.all([
        prisma_1.default.product.findMany({
            where: { id: { in: productIds } },
        }),
        prisma_1.default.cartItem.findMany({
            where: {
                userId,
                productId: { in: productIds },
            },
        }),
    ]);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const cartItemMap = new Map(cartItems.map((ci) => [ci.productId, ci]));
    const updatesToApply = [];
    const updated = [];
    const removed = [];
    const errors = [];
    for (const { productId, quantity } of updates) {
        const product = productMap.get(productId);
        const cartItem = cartItemMap.get(productId);
        if (!product) {
            errors.push({ productId, error: 'Product not found' });
            continue;
        }
        if (product.approvalStatus !== client_1.ApprovalStatus.APPROVED) {
            errors.push({ productId, error: 'Product is not approved' });
            continue;
        }
        if (quantity > product.qtyAvailable) {
            errors.push({
                productId,
                error: `Only ${product.qtyAvailable} in stock`,
            });
            continue;
        }
        if (quantity <= 0) {
            if (cartItem) {
                updatesToApply.push(prisma_1.default.cartItem
                    .delete({ where: { id: cartItem.id } })
                    .then(() => removed.push(productId)));
            }
        }
        else if (cartItem) {
            updatesToApply.push(prisma_1.default.cartItem
                .update({
                where: { id: cartItem.id },
                data: { quantity },
            })
                .then((item) => updated.push(item)));
        }
        else {
            updatesToApply.push(prisma_1.default.cartItem
                .create({
                data: {
                    userId,
                    productId,
                    quantity,
                },
            })
                .then((item) => updated.push(item)));
        }
    }
    // Wait for all Prisma actions to finish
    await Promise.all(updatesToApply);
    return {
        updated,
        removed,
        errors,
    };
};
exports.updateMultipleCartItems = updateMultipleCartItems;
