"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVendor = void 0;
const auth_service_1 = require("../services/auth.service");
const vendorOnboarding_service_1 = require("../services/vendorOnboarding.service");
const otp_service_1 = require("../services/otp.service");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const registerVendor = async (req, res) => {
    try {
        // 1. Extract required fields from request body
        const { firstName, lastName, email, password, role, phone, serviceType } = req.body;
        let { acceptedPersonalData } = req.body;
        // 2. Normalize boolean for acceptedPersonalData
        if (acceptedPersonalData == "True" || acceptedPersonalData == true || acceptedPersonalData == "true") {
            acceptedPersonalData = true;
        }
        // 3. Check if identity image is uploaded
        if (!req.file) {
            return res.status(400).json({ error: "No identity image uploaded" });
        }
        // 4. Extract file buffer and mimetype from multer file
        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        // 5. Upload image to Cloudinary
        const { secure_url } = await (0, cloudinary_1.default)(fileBuffer, mimeType);
        // 6. Register the user (role: VENDOR)
        const user = await (0, auth_service_1.registerUser)(email, password, firstName, lastName, role, acceptedPersonalData, phone);
        // 7. Create vendor onboarding with Cloudinary image
        await (0, vendorOnboarding_service_1.createVendorOnboarding)(user.id, serviceType, secure_url);
        await (0, otp_service_1.sendOtpService)(email);
        // 8. Return successful response
        res.status(201).json({
            success: true,
            message: "Vendor registered successfully",
            data: {
                user,
                identityImage: secure_url
            }
        });
    }
    catch (err) {
        // 9. Handle errors
        res.status(400).json({ error: err.message });
    }
};
exports.registerVendor = registerVendor;
