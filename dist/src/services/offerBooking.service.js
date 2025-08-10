"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOfferBooking = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const wallet_service_1 = require("./wallet.service");
const createOfferBooking = async ({ clientId, vendorId, offerId, serviceOfferId, paymentMethod, serviceName, serviceType, offerAmount, totalAmount, price, date, time, reference, serviceImage, referencePhoto, // <-- can be top-level or inside locationDetails depending on your model
locationDetails, }) => {
    if (paymentMethod === "SHARP-PAY") {
        const wallet = await (0, wallet_service_1.getUserWallet)(clientId);
        if (!wallet || wallet.balance < price) {
            throw new Error("Insufficient wallet balance");
        }
        await (0, wallet_service_1.debitWallet)(wallet.id, price, "Booking Payment", reference);
    }
    return await prisma_1.default.serviceOfferBooking.create({
        data: {
            clientId,
            vendorId,
            serviceOfferId,
            serviceName,
            price,
            totalAmount,
            time,
            date: new Date(date),
            paymentMethod,
            paymentStatus: client_1.PaymentStatus.LOCKED,
            reference,
            referencePhoto,
            status: client_1.BookingStatus.PENDING,
        },
        include: {
            client: true,
            vendor: true,
            serviceOffer: true,
        },
    });
};
exports.createOfferBooking = createOfferBooking;
