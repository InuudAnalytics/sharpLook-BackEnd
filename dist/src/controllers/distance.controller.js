"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = void 0;
const distance_1 = require("../utils/distance");
const prisma_1 = __importDefault(require("../config/prisma"));
const calculateDistance = async (req, res) => {
    const { clientLat, clientLng, vendorIds } = req.body;
    if (typeof clientLat !== "number" ||
        typeof clientLng !== "number" ||
        (!vendorIds || (typeof vendorIds !== "string" && !Array.isArray(vendorIds)))) {
        return res.status(400).json({ error: "Invalid input data." });
    }
    try {
        const vendorIdArray = Array.isArray(vendorIds) ? vendorIds : [vendorIds];
        const vendors = await prisma_1.default.vendorOnboarding.findMany({
            where: {
                userId: {
                    in: vendorIdArray,
                },
            },
            select: {
                userId: true,
                latitude: true,
                longitude: true,
            },
        });
        if (!vendors.length) {
            return res.status(404).json({ error: "No valid vendors found." });
        }
        const results = [];
        let totalKm = 0;
        for (const vendor of vendors) {
            if (vendor.latitude != null && vendor.longitude != null) {
                const distance = (0, distance_1.haversineDistanceKm)(clientLat, clientLng, vendor.latitude, vendor.longitude);
                const roundedKm = Math.round(distance);
                const transportPrice = roundedKm * 200;
                totalKm += roundedKm;
                results.push({
                    vendorId: vendor.userId,
                    distanceKm: roundedKm,
                    transportPrice,
                });
            }
        }
        return res.status(200).json({
            totalVendors: results.length,
            totalKm,
            totalTransportCost: totalKm * 200,
            breakdown: results,
        });
    }
    catch (error) {
        console.error("Error calculating distances:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};
exports.calculateDistance = calculateDistance;
// let clientLat = 40.7128
// let clientLng =  -74.0060
// let vendorLat =  30.0444
// let vendorLng =   31.2357
// let answer = haversineDistanceKm(clientLat,clientLng, vendorLat, vendorLng )
// let whole  =Math.round(answer)
// console.log( whole * 200);
