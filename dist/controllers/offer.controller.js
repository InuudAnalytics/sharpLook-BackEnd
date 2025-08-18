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
exports.tipOffer = exports.getMyOffers = exports.getAllAvailableOffersHandler = exports.handleCancelOffer = exports.getNearbyOffersHandler = exports.handleGetVendorsForOffer = exports.selectVendorController = exports.handleVendorAccept = exports.handleCreateOffer = void 0;
const OfferService = __importStar(require("../services/offer.service"));
const notification_service_1 = require("../services/notification.service");
const cloudinary_1 = require("../utils/cloudinary");
const handleCreateOffer = async (req, res) => {
    try {
        const data = req.body;
        const clientId = req.user?.id;
        // Ensure client is authenticated
        if (!clientId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Client not authenticated.",
            });
        }
        // // Basic input validation
        // const requiredFields = [
        //   "serviceName",
        //   "serviceType",
        //   "offerAmount",
        //   "fullAddress",
        //   "landMark",
        //   "date",
        //   "time",
        // ];
        // Validate offerAmount
        if (isNaN(Number(data.offerAmount)) || Number(data.offerAmount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Offer amount must be a valid positive number.",
            });
        }
        // Validate date and time
        const offerDate = new Date(data.date);
        if (isNaN(offerDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format.",
            });
        }
        // Handle image upload if present
        let serviceImageUrl = "";
        if (req.file) {
            try {
                const result = await (0, cloudinary_1.uploadBufferToCloudinary)(req.file.buffer, "SharpLook/ServiceOffers");
                serviceImageUrl = result.secure_url;
            }
            catch (uploadErr) {
                console.error("Cloudinary upload error:", uploadErr);
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed. Please try again.",
                });
            }
        }
        const offer = await OfferService.createServiceOffer(clientId, data, serviceImageUrl);
        try {
            await (0, notification_service_1.notifyNearbyVendors)(offer);
        }
        catch (notifyErr) {
            console.warn("Failed to notify vendors, but offer was created.");
        }
        return res.status(201).json({
            success: true,
            message: "Service offer created successfully.",
            data: offer,
        });
    }
    catch (err) {
        console.error("Offer creation error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later.",
        });
    }
};
exports.handleCreateOffer = handleCreateOffer;
const handleVendorAccept = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { offerId, price } = req.body;
        const acceptance = await OfferService.vendorAcceptOffer(vendorId, offerId, price);
        return res.status(200).json({
            success: true,
            message: "Offer accepted successfully. Client has been notified.",
            data: acceptance,
        });
    }
    catch (error) {
        console.error("Controller error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong.",
        });
    }
};
exports.handleVendorAccept = handleVendorAccept;
const selectVendorController = async (req, res) => {
    const { offerId, selectedVendorId, reference, paymentMethod, totalAmount } = req.body;
    const clientId = req.user.id;
    console.log("this is body data", req.body);
    // Validate required fields dynamically based on payment method
    const requiredFields = ["offerId", "selectedVendorId", "paymentMethod"];
    // Only require reference if paymentMethod is not "Sharp Pay"
    if (paymentMethod !== "SHARP-PAY") {
        requiredFields.push("reference");
    }
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                message: `Missing required field: ${field}`,
            });
        }
    }
    const result = await OfferService.selectVendorForOffer(offerId, selectedVendorId, reference, paymentMethod, totalAmount);
    if (result.success) {
        await (0, notification_service_1.createNotification)(clientId, `Your booking for a service Offer has been placed successfully.`);
        await (0, notification_service_1.createNotification)(selectedVendorId, `The Service offer you accepted has been acknowledged and requested`);
        return res.status(200).json(result);
    }
    else {
        return res.status(500).json(result);
    }
};
exports.selectVendorController = selectVendorController;
const handleGetVendorsForOffer = async (req, res) => {
    const { offerId } = req.body;
    const vendors = await OfferService.getVendorsForOffer(offerId);
    res.json({ success: true, data: vendors });
};
exports.handleGetVendorsForOffer = handleGetVendorsForOffer;
const getNearbyOffersHandler = async (req, res) => {
    const vendorId = req.user.id;
    try {
        const offers = await OfferService.getNearbyOffersByCoordinates(vendorId);
        res.status(200).json({ success: true, data: offers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getNearbyOffersHandler = getNearbyOffersHandler;
const handleCancelOffer = async (req, res) => {
    const clientId = req.user.id;
    const { offerId } = req.body;
    await OfferService.cancelOffer(offerId, clientId);
    res.json({ success: true, message: "Offer cancelled" });
};
exports.handleCancelOffer = handleCancelOffer;
const getAllAvailableOffersHandler = async (req, res) => {
    try {
        const offers = await OfferService.getAllAvailableOffers();
        res.status(200).json({ success: true, data: offers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllAvailableOffersHandler = getAllAvailableOffersHandler;
const getMyOffers = async (req, res) => {
    try {
        const clientId = req.user.id;
        const offers = await OfferService.getClientOffers(clientId);
        res.json({ success: true, offers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyOffers = getMyOffers;
const tipOffer = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { offerId, tipAmount } = req.body;
        if (!tipAmount || isNaN(tipAmount)) {
            return res.status(400).json({ message: "Invalid tip amount" });
        }
        const updatedOffer = await OfferService.addTipToOffer(clientId, offerId, Number(tipAmount));
        res.json({ success: true, message: "Tip added successfully", offer: updatedOffer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.tipOffer = tipOffer;
