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
exports.addTipToOffer = exports.getClientOffers = exports.getAllAvailableOffers = exports.cancelOffer = exports.getNearbyOffersByCoordinates = exports.selectVendorForOffer = exports.vendorAcceptOffer = exports.getVendorsForOffer = exports.createServiceOffer = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const serviceOfferBookingService = __importStar(require("../services/offerBooking.service"));
const notification_service_1 = require("./notification.service");
const wallet_service_1 = require("../services/wallet.service");
const paystack_1 = require("../utils/paystack");
const client_1 = require("@prisma/client");
const createServiceOffer = async (clientId, data, serviceImage) => {
    // const requiredFields = [
    //   "serviceName",
    //   "serviceType",
    //   "offerAmount",
    //    "fullAddress",
    //   "landMark",
    //   "date",
    //   "time",
    //    "landMark",
    //     "fullAddress",
    //     "paymentMethod",
    //     "totalAmount"
    // ];
    // for (const field of requiredFields) {
    //   if (!data[field]) {
    //     throw new Error(`Missing required field: ${field}`);
    //   }
    // }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    return await prisma_1.default.serviceOffer.create({
        data: {
            clientId,
            serviceName: data.serviceName,
            serviceType: data.serviceType,
            offerAmount: Number(data.offerAmount),
            date: data.date,
            time: data.time,
            latitude: data.latitude ? parseFloat(data.latitude) : undefined,
            longitude: data.longitude ? parseFloat(data.longitude) : undefined,
            serviceImage,
            expiresAt,
            landMark: data.landMark,
            fullAddress: data.fullAddress,
            paymentMethod: data.paymentMethod,
            totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
        },
    });
};
exports.createServiceOffer = createServiceOffer;
const getVendorsForOffer = async (offerId) => {
    const vendors = await prisma_1.default.vendorOffer.findMany({
        where: { serviceOfferId: offerId },
        include: {
            vendor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    vendorOnboarding: true,
                    vendorServices: true,
                    vendorReviews: true,
                    vendorAvailability: true,
                    products: true, // will filter this manually
                },
            },
        },
    });
    const cleanedVendors = vendors.map((entry) => {
        const vendor = entry.vendor;
        const approvedProducts = vendor.products.filter((product) => product.approvalStatus === client_1.ApprovalStatus.APPROVED);
        return {
            ...vendor,
            products: approvedProducts,
        };
    });
    return {
        offerId,
        totalVendors: cleanedVendors.length,
        vendors: cleanedVendors,
    };
};
exports.getVendorsForOffer = getVendorsForOffer;
const vendorAcceptOffer = async (vendorId, offerId, price) => {
    // Check if vendor already accepted this offer
    const existing = await prisma_1.default.vendorOffer.findFirst({
        where: {
            vendorId,
            serviceOfferId: offerId,
        },
    });
    if (existing) {
        throw new Error("You’ve already accepted this offer.");
    }
    // Fetch offer details
    const offer = await prisma_1.default.serviceOffer.findUnique({
        where: { id: offerId },
        select: {
            clientId: true,
            serviceName: true,
        },
    });
    if (!offer)
        throw new Error("Offer not found");
    const { clientId, serviceName } = offer;
    // Fetch vendor details from User model
    const vendor = await prisma_1.default.user.findUnique({
        where: { id: vendorId },
        select: {
            firstName: true,
            lastName: true,
            vendorOnboarding: {
                select: {
                    businessName: true,
                },
            },
        },
    });
    if (!vendor)
        throw new Error("Vendor not found");
    const vendorName = `${vendor.firstName} ${vendor.lastName}`;
    const vendorDisplayName = vendor.vendorOnboarding?.businessName
        ? `${vendorName} (${vendor.vendorOnboarding.businessName})`
        : vendorName;
    // Send notification to client with vendor info
    await (0, notification_service_1.createNotification)(clientId, `${vendorDisplayName} has accepted your request for "${serviceName}".`);
    // Create vendor offer record
    await prisma_1.default.vendorOffer.create({
        data: {
            vendorId,
            serviceOfferId: offerId,
            price,
            isAccepted: true,
        },
    });
    return { success: true, message: "Offer accepted and client notified." };
};
exports.vendorAcceptOffer = vendorAcceptOffer;
const selectVendorForOffer = async (offerId, selectedVendorId, reference, paymentMethod, totalAmount) => {
    try {
        // 1. Update offer with selection and payment info
        await prisma_1.default.serviceOffer.update({
            where: { id: offerId },
            data: {
                status: "SELECTED",
                reference,
                paymentMethod,
                totalAmount,
            },
        });
        // 2. Reset all vendorOffer.isAccepted to false
        await prisma_1.default.vendorOffer.updateMany({
            where: { serviceOfferId: offerId },
            data: { isAccepted: false },
        });
        // 3. Mark selected vendor's offer as accepted
        await prisma_1.default.vendorOffer.updateMany({
            where: {
                serviceOfferId: offerId,
                vendorId: selectedVendorId,
            },
            data: { isAccepted: true },
        });
        // 4. Fetch full offer
        const offer = await prisma_1.default.serviceOffer.findUnique({
            where: { id: offerId },
        });
        if (!offer)
            throw new Error("Offer not found");
        const { id: serviceOfferId, clientId, serviceType, offerAmount, serviceName, date, time, referencePhoto, specialInstruction, serviceImage, homeLocation, fullAddress, landMark, } = offer;
        // if (!totalAmount) throw new Error("Total amount missing");
        if (!selectedVendorId)
            throw new Error("Selected vendor ID missing");
        const finalPaymentMethod = paymentMethod;
        const finalReference = reference;
        const transactionReference = (0, paystack_1.generateReference)(); // 🔐 Ensure unique wallet reference
        console.log(finalReference);
        // 5. Get price from vendorOffer
        const vendorOffer = await prisma_1.default.vendorOffer.findFirst({
            where: {
                serviceOfferId: offerId,
                vendorId: selectedVendorId,
            },
        });
        if (!vendorOffer || !vendorOffer.price) {
            throw new Error("Vendor's offer price not found");
        }
        const price = vendorOffer.price;
        // 6. Handle SHARP-PAY wallet deduction
        if (finalPaymentMethod === "SHARP-PAY") {
            const wallet = await (0, wallet_service_1.getUserWallet)(clientId);
            if (!wallet || wallet.balance < price) {
                return {
                    success: false,
                    message: "Insufficient wallet balance",
                };
            }
            reference = transactionReference;
            await (0, wallet_service_1.debitWallet)(wallet.id, price, "Offer Booking Payment", reference);
        }
        else {
            if (!reference || reference.trim() === "") {
                return {
                    success: false,
                    message: "Payment reference is required for this payment method",
                };
            }
        }
        // 7. Create booking
        await serviceOfferBookingService.createOfferBooking({
            clientId,
            vendorId: selectedVendorId,
            offerId,
            serviceOfferId,
            paymentMethod: finalPaymentMethod,
            serviceName,
            serviceType,
            offerAmount,
            totalAmount,
            price,
            date: date.toISOString(),
            time,
            reference: finalReference,
            serviceImage,
            referencePhoto: referencePhoto ?? undefined,
            locationDetails: {
                homeLocation: homeLocation ?? undefined,
                fullAddress: fullAddress ?? undefined,
                landMark: landMark ?? undefined,
                referencePhoto: referencePhoto ?? undefined,
                specialInstruction: specialInstruction ?? undefined,
            },
        });
        // 8. Notify vendor
        await prisma_1.default.notification.create({
            data: {
                userId: selectedVendorId,
                type: "VENDOR_SELECTED",
                message: `You’ve been selected for the service: ${serviceName}`,
            },
        });
        return {
            success: true,
            message: "Vendor selected and service offer booking created successfully.",
        };
    }
    catch (error) {
        console.error("❌ Error in selectVendorForOffer:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error selecting vendor",
        };
    }
};
exports.selectVendorForOffer = selectVendorForOffer;
const EARTH_RADIUS_KM = 6371;
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}
const getNearbyOffersByCoordinates = async (vendorId) => {
    const vendor = await prisma_1.default.user.findUnique({
        where: { id: vendorId },
        include: {
            vendorOnboarding: true,
        },
    });
    if (!vendor?.vendorOnboarding?.latitude ||
        !vendor?.vendorOnboarding?.longitude) {
        throw new Error("Vendor coordinates not found.");
    }
    const allOffers = await prisma_1.default.serviceOffer.findMany({
        where: {
            status: "PENDING",
            expiresAt: { gte: new Date() },
        },
        include: {
            client: true,
        },
    });
    const nearbyOffers = allOffers.filter((offer) => {
        if (!offer.latitude || !offer.longitude)
            return false;
        const distance = haversineDistance(vendor.vendorOnboarding.latitude, vendor.vendorOnboarding.longitude, offer.latitude, offer.longitude);
        return distance <= 10; // limit to 10km radius
    });
    return nearbyOffers;
};
exports.getNearbyOffersByCoordinates = getNearbyOffersByCoordinates;
const cancelOffer = async (offerId, clientId) => {
    return await prisma_1.default.serviceOffer.updateMany({
        where: { id: offerId, clientId },
        data: { status: "CANCELLED" },
    });
};
exports.cancelOffer = cancelOffer;
const getAllAvailableOffers = async () => {
    return prisma_1.default.serviceOffer.findMany({
        where: {
            status: "PENDING",
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            client: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
};
exports.getAllAvailableOffers = getAllAvailableOffers;
const getClientOffers = async (clientId) => {
    return await prisma_1.default.serviceOffer.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        include: {
            vendorOffers: {
                include: {
                    vendor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            vendorOnboarding: {
                                select: {
                                    businessName: true,
                                    latitude: true,
                                    longitude: true,
                                },
                            },
                            vendorAvailability: {
                                select: {
                                    days: true,
                                    fromTime: true,
                                    toTime: true,
                                },
                            },
                            vendorReviews: {
                                where: {
                                    OR: [
                                        { type: 'VENDOR' },
                                        { type: 'SERVICE' },
                                    ],
                                },
                                select: {
                                    type: true,
                                    rating: true,
                                    comment: true,
                                    createdAt: true,
                                    service: {
                                        select: {
                                            serviceName: true,
                                        },
                                    },
                                    client: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });
};
exports.getClientOffers = getClientOffers;
const addTipToOffer = async (clientId, offerId, tipAmount) => {
    const offer = await prisma_1.default.serviceOffer.findUnique({
        where: { id: offerId },
    });
    if (!offer)
        throw new Error("Offer not found");
    if (offer.clientId !== clientId)
        throw new Error("Unauthorized action");
    const newAmount = Number(offer.offerAmount) + Number(tipAmount);
    return await prisma_1.default.serviceOffer.update({
        where: { id: offerId },
        data: { offerAmount: newAmount },
    });
};
exports.addTipToOffer = addTipToOffer;
