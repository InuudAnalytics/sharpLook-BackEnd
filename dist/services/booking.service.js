"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payForAcceptedBooking = exports.acceptBooking = exports.homeServiceCreateBooking = exports.getUserBookings = exports.getBookingById = exports.markBookingCompletedByVendor = exports.markBookingCompletedByClient = exports.updateBookingStatus = exports.createBooking = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const wallet_service_1 = require("./wallet.service");
const paystack_1 = require("../utils/paystack"); // if Paystack used
const createBooking = async (clientId, vendorId, serviceId, paymentMethod, serviceName, price, totalAmount, time, date, reference, referencePhoto) => {
    if (paymentMethod === "SHARP-PAY") {
        const wallet = await (0, wallet_service_1.getUserWallet)(clientId);
        if (!wallet || wallet.balance < price) {
            return {
                success: false,
                message: "Insufficient wallet balance",
            };
        }
        await (0, wallet_service_1.debitWallet)(wallet.id, price, "Booking Payment", reference);
    }
    else {
        // For other payment methods, reference must be provided
        if (!reference || reference.trim() === "") {
            return {
                success: false,
                message: "Payment reference is required for this payment method",
            };
        }
    }
    const booking = await prisma_1.default.booking.create({
        data: {
            clientId,
            vendorId,
            serviceId,
            totalAmount,
            paymentMethod,
            paymentStatus: client_1.PaymentStatus.LOCKED,
            serviceName,
            date: new Date(date),
            time,
            price,
            status: client_1.BookingStatus.PENDING,
            reference,
            referencePhoto,
        },
        include: {
            vendor: true,
            service: true,
        },
    });
    return {
        success: true,
        message: "Booking created successfully",
        data: booking,
    };
};
exports.createBooking = createBooking;
const updateBookingStatus = async (bookingId, status, refundReference // <-- optional reference for refund
) => {
    const booking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new Error("Booking not found");
    if (status === client_1.BookingStatus.REJECTED && booking.paymentStatus === client_1.PaymentStatus.LOCKED) {
        const wallet = await (0, wallet_service_1.getUserWallet)(booking.clientId);
        if (!wallet)
            throw new Error("Client wallet not found");
        if (!refundReference)
            throw new Error("Refund reference required");
        await (0, wallet_service_1.creditWallet)(wallet.id, booking.price, "Booking Refund", refundReference);
        return prisma_1.default.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.REJECTED,
                paymentStatus: client_1.PaymentStatus.REFUNDED,
            },
        });
    }
    if (status === client_1.BookingStatus.ACCEPTED) {
        return prisma_1.default.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.ACCEPTED },
        });
    }
    return prisma_1.default.booking.update({
        where: { id: bookingId },
        data: { status },
    });
};
exports.updateBookingStatus = updateBookingStatus;
const markBookingCompletedByClient = async (bookingId, creditReference) => {
    const booking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new Error("Booking not found");
    const updated = await prisma_1.default.booking.update({
        where: { id: bookingId },
        data: { clientCompleted: true },
    });
    if (updated.vendorCompleted) {
        await finalizeBookingPayment(updated, creditReference);
    }
    return updated;
};
exports.markBookingCompletedByClient = markBookingCompletedByClient;
const markBookingCompletedByVendor = async (bookingId, creditReference // reference to pass on final credit
) => {
    const booking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new Error("Booking not found");
    const updated = await prisma_1.default.booking.update({
        where: { id: bookingId },
        data: { vendorCompleted: true },
    });
    if (updated.clientCompleted) {
        await finalizeBookingPayment(updated, creditReference);
    }
    return updated;
};
exports.markBookingCompletedByVendor = markBookingCompletedByVendor;
const finalizeBookingPayment = async (booking, reference) => {
    if (booking.paymentStatus !== client_1.PaymentStatus.LOCKED) {
        throw new Error("Booking payment is not locked or already finalized");
    }
    const vendorWallet = await (0, wallet_service_1.getUserWallet)(booking.vendorId);
    if (!vendorWallet)
        throw new Error("Vendor wallet not found");
    await (0, wallet_service_1.creditWallet)(vendorWallet.id, booking.price, "Booking Payment Received", reference);
    return await prisma_1.default.booking.update({
        where: { id: booking.id },
        data: {
            paymentStatus: client_1.PaymentStatus.COMPLETED,
            status: client_1.BookingStatus.COMPLETED,
        },
    });
};
const getBookingById = async (bookingId) => {
    return await prisma_1.default.booking.findUnique({
        where: { id: bookingId },
    });
};
exports.getBookingById = getBookingById;
const getUserBookings = async (userId, role) => {
    const condition = role === "CLIENT" ? { clientId: userId } : { vendorId: userId };
    const includeUser = role === "CLIENT"
        ? {
            vendor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    vendorOnboarding: {
                        select: {
                            businessName: true,
                            location: true,
                        },
                    },
                },
            },
        }
        : {
            client: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
        };
    return await prisma_1.default.booking.findMany({
        where: condition,
        include: {
            ...includeUser,
            service: {
                select: {
                    id: true,
                    serviceName: true,
                    serviceImage: true,
                    description: true,
                    reviews: {
                        select: {
                            id: true,
                            rating: true,
                            comment: true,
                            clientId: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getUserBookings = getUserBookings;
const homeServiceCreateBooking = async (clientId, vendorId, serviceId, paymentMethod, serviceName, price, totalAmount, time, date, reference, serviceType, homeDetails) => {
    try {
        const isHomeService = serviceType === "HOME_SERVICE";
        const baseData = {
            clientId,
            vendorId,
            serviceId,
            serviceName,
            totalAmount,
            paymentMethod,
            date: new Date(date),
            time,
            price,
            reference: reference || null,
            status: client_1.BookingStatus.PENDING,
            paymentStatus: client_1.PaymentStatus.LOCKED,
            referencePhoto: homeDetails?.referencePhoto || null,
        };
        if (isHomeService && homeDetails) {
            Object.assign(baseData, {
                serviceLocation: homeDetails.serviceLocation,
                fullAddress: homeDetails.fullAddress,
                landmark: homeDetails.landmark,
                specialInstruction: homeDetails.specialInstruction,
            });
        }
        if (paymentMethod === "SHARP-PAY") {
            const wallet = await (0, wallet_service_1.getUserWallet)(clientId);
            if (!wallet || wallet.balance < price) {
                return {
                    success: false,
                    message: "Insufficient wallet balance",
                };
            }
            await (0, wallet_service_1.debitWallet)(wallet.id, price, "Booking Payment", reference);
        }
        else {
            // Non-wallet payments must have a reference
            if (!reference || reference.trim() === "") {
                return {
                    success: false,
                    message: "Payment reference is required for this payment method",
                };
            }
        }
        const booking = await prisma_1.default.booking.create({
            data: baseData,
            include: {
                vendor: true,
                service: true,
            },
        });
        return {
            success: true,
            message: "Booking created successfully",
            data: booking,
        };
    }
    catch (error) {
        return {
            success: false,
            message: error.message || "Something went wrong",
        };
    }
};
exports.homeServiceCreateBooking = homeServiceCreateBooking;
const acceptBooking = async (vendorId, bookingId) => {
    const updated = await prisma_1.default.booking.updateMany({
        where: { id: bookingId, status: client_1.BookingStatus.PENDING },
        data: { status: client_1.BookingStatus.ACCEPTED, vendorId },
    });
    if (updated.count === 0)
        throw new Error("Booking not found, unauthorized, or already accepted");
    const booking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking.clientId)
        throw new Error("Missing clientId for notification");
    await prisma_1.default.notification.create({
        data: {
            userId: booking.clientId ?? undefined,
            message: `Your booking "${booking.serviceName}" has been accepted!`,
            type: "BOOKING",
        },
    });
    return booking;
};
exports.acceptBooking = acceptBooking;
const payForAcceptedBooking = async (clientId, bookingId, reference, paymentMethod) => {
    const booking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.clientId !== clientId)
        throw new Error("Not found or unauthorized");
    if (booking.status !== client_1.BookingStatus.ACCEPTED)
        throw new Error("Booking not accepted");
    if (booking.paymentStatus !== client_1.PaymentStatus.PENDING)
        throw new Error("Already paid");
    if (paymentMethod === "SHARP-PAY") {
        const wallet = await (0, wallet_service_1.getUserWallet)(clientId);
        if (!wallet || wallet.balance < booking.price) {
            throw new Error("Insufficient wallet balance");
        }
        await (0, wallet_service_1.debitWallet)(wallet.id, booking.price, "Booking Payment", reference);
    }
    if (paymentMethod === "PAYSTACK") {
        const result = await (0, paystack_1.verifyPayment)(reference);
        if (result.status !== "success") {
            throw new Error("Payment verification failed");
        }
    }
    const updated = await prisma_1.default.booking.update({
        where: { id: bookingId },
        data: {
            paymentStatus: client_1.PaymentStatus.LOCKED,
            reference,
        },
    });
    await prisma_1.default.notification.create({
        data: {
            userId: booking.vendorId,
            message: `Payment completed for booking "${booking.serviceName}".`,
            type: "BOOKING",
        },
    });
    return updated;
};
exports.payForAcceptedBooking = payForAcceptedBooking;
