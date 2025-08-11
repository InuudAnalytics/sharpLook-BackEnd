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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorOrderDisputeStatusHandler = exports.getAllVendorOrderDisputesHandler = exports.createVendorOrderDisputeHandler = exports.resolveDispute = exports.getDisputes = exports.raiseDispute = void 0;
const DisputeService = __importStar(require("../services/dispute.service"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const dispute_service_1 = require("../services/dispute.service");
exports.raiseDispute = [
    async (req, res) => {
        const { bookingId, reason } = req.body;
        const userId = req.user?.id;
        const raisedById = userId;
        try {
            let imageUrl;
            if (req.file) {
                const result = await (0, cloudinary_1.default)(req.file.buffer, "hairdesign/vendors");
                imageUrl = result.secure_url;
            }
            const dispute = await DisputeService.createDispute(bookingId, raisedById, reason, imageUrl);
            res.status(201).json({ success: true, message: "Dispute submitted", dispute });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Dispute creation failed" });
        }
    }
];
const getDisputes = async (_req, res) => {
    try {
        const disputes = await DisputeService.getAllDisputes();
        res.json({ success: true, disputes });
    }
    catch (error) {
        console.error("Failed to get disputes:", error);
        res.status(500).json({ success: false, message: "Failed to fetch disputes" });
    }
};
exports.getDisputes = getDisputes;
const resolveDispute = async (req, res) => {
    const { status, resolution, id } = req.body;
    if (!["RESOLVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }
    try {
        const updated = await DisputeService.updateDisputeStatus(id, status, resolution);
        res.json({ success: true, message: `Dispute ${status.toLowerCase()}`, dispute: updated });
    }
    catch (error) {
        console.error("Failed to update dispute:", error);
        res.status(500).json({ success: false, message: "Failed to update dispute" });
    }
};
exports.resolveDispute = resolveDispute;
const createVendorOrderDisputeHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reason, vendorOrderIds } = req.body;
        console.log("Received reason:", reason);
        console.log("Received vendorOrderIds:", vendorOrderIds);
        console.log("Type of vendorOrderIds:", typeof vendorOrderIds);
        if (!reason || !vendorOrderIds) {
            return res.status(400).json({ error: "Missing reason or vendorOrderIds" });
        }
        let parsedVendorOrderIds;
        if (typeof vendorOrderIds === "string") {
            try {
                parsedVendorOrderIds = JSON.parse(vendorOrderIds);
            }
            catch (e) {
                console.error("Error parsing vendorOrderIds:", e);
                return res.status(400).json({ error: "vendorOrderIds must be a valid JSON array" });
            }
        }
        else if (Array.isArray(vendorOrderIds)) {
            parsedVendorOrderIds = vendorOrderIds;
        }
        else {
            return res.status(400).json({ error: "vendorOrderIds must be a non-empty array" });
        }
        if (!Array.isArray(parsedVendorOrderIds) || parsedVendorOrderIds.length === 0) {
            return res.status(400).json({ error: "vendorOrderIds must be a non-empty array" });
        }
        let disputeImage;
        if (req.file) {
            const result = await (0, cloudinary_1.default)(req.file.buffer, "hairdesign/vendors");
            disputeImage = result.secure_url;
        }
        const disputes = await (0, dispute_service_1.createVendorOrderDispute)(parsedVendorOrderIds, userId, reason, disputeImage);
        return res.status(201).json({
            success: true,
            message: "Dispute(s) created successfully",
            data: disputes,
        });
    }
    catch (err) {
        console.error("Dispute creation error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.createVendorOrderDisputeHandler = createVendorOrderDisputeHandler;
const getAllVendorOrderDisputesHandler = async (req, res) => {
    try {
        const disputes = await (0, dispute_service_1.getAllVendorOrderDisputes)();
        return res.status(200).json(disputes);
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to fetch disputes", message: err });
    }
};
exports.getAllVendorOrderDisputesHandler = getAllVendorOrderDisputesHandler;
const updateVendorOrderDisputeStatusHandler = async (req, res) => {
    try {
        const { status, resolution, disputeId } = req.body;
        // ✅ Validate input
        if (!disputeId || !status) {
            return res.status(400).json({ error: "disputeId and status are required" });
        }
        if (!["RESOLVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ error: "Invalid dispute status" });
        }
        const updatedDispute = await (0, dispute_service_1.updateVendorOrderDisputeStatus)(disputeId, status, resolution);
        return res.status(200).json({
            message: "Dispute updated successfully",
            data: updatedDispute,
        });
    }
    catch (err) {
        console.error("Error updating dispute:", err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
};
exports.updateVendorOrderDisputeStatusHandler = updateVendorOrderDisputeStatusHandler;
