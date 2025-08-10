"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartItemQuantity = exports.removeProductFromCart = exports.getMyCart = exports.addProductToCart = void 0;
const CartService = __importStar(require("../services/cart.service"));
const addProductToCart = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({
            success: false,
            message: "Product ID is required"
        });
    }
    try {
        const cartItem = await CartService.addToCart(userId, productId);
        return res.status(201).json({
            success: true,
            message: "Product added to cart successfully",
            data: cartItem
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.addProductToCart = addProductToCart;
const getMyCart = async (req, res) => {
    const userId = req.user.id;
    try {
        const cart = await CartService.getUserCart(userId);
        return res.status(200).json({
            success: true,
            message: "Cart retrieved successfully",
            data: cart
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getMyCart = getMyCart;
const removeProductFromCart = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;
    try {
        await CartService.removeFromCart(userId, productId);
        return res.status(200).json({
            success: true,
            message: "Product removed from cart"
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.removeProductFromCart = removeProductFromCart;
const updateCartItemQuantity = async (req, res) => {
    const userId = req.user.id;
    const { quantity, productId } = req.body;
    if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be a non-negative number"
        });
    }
    try {
        const updatedItem = await CartService.updateCartQuantity(userId, productId, quantity);
        return res.status(200).json({
            success: true,
            message: quantity === 0
                ? "Product removed from cart"
                : "Cart quantity updated successfully",
            data: updatedItem || null,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
exports.updateCartItemQuantity = updateCartItemQuantity;
