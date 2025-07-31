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
exports.resolveDispute = exports.getDisputes = exports.raiseDispute = void 0;
const DisputeService = __importStar(require("../services/dispute.service"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
exports.raiseDispute = [
    async (req, res) => {
        const { bookingId, reason } = req.body;
        const userId = req.user?.id;
        try {
            let imageUrl;
            if (req.file) {
                const result = await (0, cloudinary_1.default)(req.file.buffer, "hairdesign/vendors");
                imageUrl = result.secure_url;
            }
            const dispute = await DisputeService.createDispute(bookingId, userId, reason, imageUrl);
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
