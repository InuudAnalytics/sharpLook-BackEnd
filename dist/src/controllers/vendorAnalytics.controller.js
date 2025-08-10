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
exports.fetchVendorAnalytics = exports.fetchVendorEarningsGraph = void 0;
const VendorAnalyticsService = __importStar(require("../services/vendorAnalytics.service"));
const vendorAnalytics_service_1 = require("../services/vendorAnalytics.service");
const fetchVendorEarningsGraph = async (req, res) => {
    try {
        const vendorId = req.user?.id;
        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Vendor ID missing",
            });
        }
        const analytics = await (0, vendorAnalytics_service_1.getVendorEarningsGraphData)(vendorId);
        return res.status(200).json({
            success: true,
            message: "Graph earnings data fetched successfully",
            data: analytics,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch analytics data",
        });
    }
};
exports.fetchVendorEarningsGraph = fetchVendorEarningsGraph;
const fetchVendorAnalytics = async (req, res) => {
    const vendorId = req.params.vendorId;
    try {
        const data = await VendorAnalyticsService.getVendorAnalytics(vendorId);
        return res.status(200).json({
            success: true,
            message: "Vendor analytics fetched successfully",
            data
        });
    }
    catch (err) {
        console.error("Analytics error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch vendor analytics",
        });
    }
};
exports.fetchVendorAnalytics = fetchVendorAnalytics;
