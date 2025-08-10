"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistanceKm = void 0;
const haversineDistanceKm = (clientLat, clientLong, vendorLat, vendorLong) => {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const R = 6371; // Radius of Earth in KM
    const dLat = toRadians(vendorLat - clientLat);
    const dLon = toRadians(vendorLong - clientLong);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(clientLat)) *
            Math.cos(toRadians(vendorLat)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.haversineDistanceKm = haversineDistanceKm;
