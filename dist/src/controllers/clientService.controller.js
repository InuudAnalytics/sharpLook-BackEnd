"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchVendorServices = exports.fetchAllServices = void 0;
const clientService_service_1 = require("../services/clientService.service");
const fetchAllServices = async (_req, res) => {
    try {
        const services = await (0, clientService_service_1.getAllVendorServices)();
        return res.status(200).json({
            success: true,
            message: "All vendor services fetched successfully",
            data: services
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.fetchAllServices = fetchAllServices;
const fetchVendorServices = async (req, res) => {
    const { vendorId } = req.params;
    try {
        const services = await (0, clientService_service_1.getVendorServicesByVendorId)(vendorId);
        return res.status(200).json({
            success: true,
            message: `Services for vendor ${vendorId} fetched successfully`,
            data: services
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.fetchVendorServices = fetchVendorServices;
