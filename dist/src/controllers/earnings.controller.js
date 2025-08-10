"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorEarnings = void 0;
const earnings_service_1 = require("../services/earnings.service");
const getVendorEarnings = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const earnings = await (0, earnings_service_1.calculateEarnings)(vendorId);
        return res.status(200).json({
            success: true,
            message: "Vendor earnings fetched successfully",
            data: earnings
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getVendorEarnings = getVendorEarnings;
