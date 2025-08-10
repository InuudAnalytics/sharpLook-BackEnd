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
exports.changePromotionStatus = exports.getAllActivePromotions = exports.getMyPromotions = exports.createPromotion = void 0;
const PromotionService = __importStar(require("../services/promotion.service"));
const createPromotion = async (req, res) => {
    const { title, description, discountPercentage, startDate, endDate } = req.body;
    const vendorId = req.user.id;
    try {
        const promo = await PromotionService.createPromotion(vendorId, title, description, parseFloat(discountPercentage), new Date(startDate), new Date(endDate));
        res.status(201).json({ success: true, data: promo });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createPromotion = createPromotion;
const getMyPromotions = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const promos = await PromotionService.getActivePromotions();
        res.json({ success: true, data: promos });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getMyPromotions = getMyPromotions;
const getAllActivePromotions = async (_, res) => {
    try {
        const promos = await PromotionService.getActivePromotions();
        res.json({ success: true, data: promos });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getAllActivePromotions = getAllActivePromotions;
const changePromotionStatus = async (req, res) => {
    const { promotionId } = req.params;
    const { isActive } = req.body;
    try {
        const promo = await PromotionService.togglePromotionStatus(promotionId, isActive);
        res.json({ success: true, data: promo });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.changePromotionStatus = changePromotionStatus;
