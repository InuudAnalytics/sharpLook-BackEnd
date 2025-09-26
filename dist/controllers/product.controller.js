"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeProduct = exports.editProduct = exports.fetchTopSellingProducts = exports.getAllProductsRatings = exports.fetchAllProducts = exports.fetchVendorProducts = exports.addProduct = void 0;
const product_service_1 = require("../services/product.service");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const product_service_2 = require("../services/product.service");
const client_1 = require("@prisma/client");
const addProduct = async (req, res) => {
    const { productName, description } = req.body;
    const price = parseFloat(req.body.price);
    const qtyAvailable = parseInt(req.body.qtyAvailable);
    if (!productName || isNaN(price) || isNaN(qtyAvailable)) {
        return res.status(400).json({
            success: false,
            message: "Product name, price, and quantity are required and must be valid"
        });
    }
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Product image is required"
        });
    }
    try {
        const cloudRes = await (0, cloudinary_1.default)(req.file.buffer, req.file.mimetype);
        const product = await (0, product_service_1.createProduct)(req.user.id, productName, price, qtyAvailable, description, cloudRes.secure_url);
        return res.status(201).json({
            success: true,
            message: "Product posted successfully",
            data: product
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to upload product"
        });
    }
};
exports.addProduct = addProduct;
const fetchVendorProducts = async (req, res) => {
    const vendorId = req.user?.id;
    if (!vendorId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Vendor ID missing",
        });
    }
    try {
        const products = await (0, product_service_2.getVendorProducts)(vendorId);
        return res.status(200).json({
            success: true,
            message: "Vendor products fetched successfully",
            data: products,
        });
    }
    catch (err) {
        console.error("❌ Error fetching vendor products:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch vendor products",
            error: err instanceof client_1.Prisma.PrismaClientKnownRequestError ? err.meta : err.message,
        });
    }
};
exports.fetchVendorProducts = fetchVendorProducts;
const fetchAllProducts = async (_req, res) => {
    try {
        const products = await (0, product_service_2.getAllProducts)();
        return res.status(200).json({
            success: true,
            message: "All products fetched successfully",
            data: products,
        });
    }
    catch (err) {
        console.error("❌ Error fetching all products:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch all products",
            error: err instanceof client_1.Prisma.PrismaClientKnownRequestError ? err.meta : err.message,
        });
    }
};
exports.fetchAllProducts = fetchAllProducts;
const getAllProductsRatings = async (_req, res) => {
    try {
        const productsRating = await (0, product_service_1.getAllProductsRatingsService)();
        return res.status(200).json({
            success: true,
            message: "All products Ratings fetched successfully",
            data: productsRating,
        });
    }
    catch (err) {
        console.error("❌ Error fetching all products:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch all products",
            error: err instanceof client_1.Prisma.PrismaClientKnownRequestError ? err.meta : err.message,
        });
    }
};
exports.getAllProductsRatings = getAllProductsRatings;
const fetchTopSellingProducts = async (req, res) => {
    const limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid limit value. Must be a positive number.",
            data: { limit: req.query.limit },
        });
    }
    try {
        const products = await (0, product_service_2.getTopSellingProducts)(limit);
        return res.status(200).json({
            success: true,
            message: "Top selling products fetched successfully",
            data: products,
        });
    }
    catch (err) {
        console.error("❌ Error fetching top selling products:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch top selling products",
            error: err instanceof client_1.Prisma.PrismaClientKnownRequestError ? err.meta : err.message,
        });
    }
};
exports.fetchTopSellingProducts = fetchTopSellingProducts;
const editProduct = async (req, res) => {
    const vendorId = req.user?.id;
    const { productId } = req.params;
    const { productName, price, qtyAvailable, description } = req.body;
    if (!vendorId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Vendor ID missing",
        });
    }
    if (!productId || !productName || price === undefined || qtyAvailable === undefined) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields",
            data: { productId, productName, price, qtyAvailable },
        });
    }
    try {
        let pictureUrl;
        if (req.file) {
            const cloudinaryRes = await (0, cloudinary_1.default)(req.file.buffer, req.file.mimetype);
            pictureUrl = cloudinaryRes.secure_url;
        }
        const updatedProduct = await (0, product_service_2.updateProduct)(productId, vendorId, productName, Number(price), Number(qtyAvailable), description, pictureUrl);
        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });
    }
    catch (err) {
        console.error("❌ Error editing product:", err);
        let statusCode = 500;
        let message = "Failed to update product";
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                message = "Product not found or not owned by vendor";
                statusCode = 404;
            }
            else if (err.code === "P2003") {
                message = "Invalid relation: vendor or product not found";
                statusCode = 400;
            }
        }
        return res.status(statusCode).json({
            success: false,
            message,
            error: err.message,
        });
    }
};
exports.editProduct = editProduct;
const removeProduct = async (req, res) => {
    const { productId } = req.params;
    if (!productId) {
        return res.status(400).json({
            success: false,
            message: "Product ID is required",
        });
    }
    try {
        await (0, product_service_2.deleteProduct)(productId);
        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: { productId },
        });
    }
    catch (err) {
        console.error("❌ Error deleting product:", err);
        let statusCode = 500;
        let message = "Failed to delete product";
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                message = "Product not found or already deleted";
                statusCode = 404;
            }
            else if (err.code === "P2003") {
                message = "Cannot delete product due to existing references (e.g., orders)";
                statusCode = 400;
            }
        }
        return res.status(statusCode).json({
            success: false,
            message,
            error: err.message,
            data: { productId },
        });
    }
};
exports.removeProduct = removeProduct;
