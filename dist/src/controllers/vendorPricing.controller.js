"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchVendorPricing = exports.setVendorPricing = void 0;
const vendorPricing_service_1 = require("../services/vendorPricing.service");
const setVendorPricing = async (req, res) => {
    try {
        // 1. Extract pricing from request body
        const pricing = req.body.pricing;
        // 2. Validate pricing presence
        if (!pricing)
            return res.status(400).json({ error: "Pricing data is required" });
        // 3. Update vendor's pricing using service
        const updated = await (0, vendorPricing_service_1.updateVendorPricing)(req.user.id, pricing);
        // 4. Respond with success
        res.json({
            success: true,
            message: "Pricing updated",
            data: updated
        });
    }
    catch (err) {
        // 5. Handle errors
        res.status(400).json({ error: err.message });
    }
};
exports.setVendorPricing = setVendorPricing;
const fetchVendorPricing = async (req, res) => {
    try {
        // 1. Fetch vendor pricing using user ID
        const pricing = await (0, vendorPricing_service_1.getVendorPricing)(req.user.id);
        // 2. Return pricing data
        res.json({ success: true, data: pricing });
    }
    catch (err) {
        // 3. Handle error
        res.status(400).json({ error: err.message });
    }
};
exports.fetchVendorPricing = fetchVendorPricing;
