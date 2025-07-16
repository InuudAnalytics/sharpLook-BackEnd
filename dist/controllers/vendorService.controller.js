"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchVendorServices = exports.createVendorService = void 0;
const vendorService_service_1 = require("../services/vendorService.service");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const createVendorService = async (req, res) => {
    console.log("➡️ [VendorService] Incoming request to create vendor service");
    const { serviceName, servicePrice } = req.body;
    const serviceImage = req.file;
    const vendorId = req.user?.id;
    console.log("📥 [VendorService] Request body:", { serviceName, servicePrice });
    console.log("📥 [VendorService] serviceImage received:", !!serviceImage);
    console.log("📥 [VendorService] Vendor ID:", vendorId);
    if (!serviceImage || !serviceName || !servicePrice) {
        console.warn("⚠️ [VendorService] Missing required fields");
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        console.log("☁️ [VendorService] Uploading serviceImage to Cloudinary...");
        const upload = await (0, cloudinary_1.default)(serviceImage.buffer, "vendor_services");
        console.log("✅ [VendorService] serviceImage uploaded successfully:", upload.secure_url);
        console.log("🛠️ [VendorService] Creating service record in database...");
        const service = await (0, vendorService_service_1.addVendorService)(vendorId, serviceName, parseFloat(servicePrice), upload.secure_url);
        console.log("✅ [VendorService] Service created successfully:", service.id);
        return res.status(201).json({
            success: true,
            message: "Vendor service created successfully",
            data: service,
        });
    }
    catch (err) {
        console.error("❌ [VendorService] Error creating vendor service:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create vendor service",
            error: err.message,
        });
    }
};
exports.createVendorService = createVendorService;
const fetchVendorServices = async (req, res) => {
    const vendorId = req.user?.id;
    try {
        const services = await (0, vendorService_service_1.getVendorServices)(vendorId);
        res.json({ success: true, data: services });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.fetchVendorServices = fetchVendorServices;
