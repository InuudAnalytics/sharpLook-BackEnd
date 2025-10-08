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
const notification_service_1 = require("./notification.service");
const notifyUser_helper_1 = require("../helpers/notifyUser.helper");
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
        // if (!refundReference) throw new Error("Refund reference required");
        await (0, wallet_service_1.creditWallet)(prisma_1.default, wallet.id, booking.price, "Booking Refund");
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
    // Try Standard Booking first
    const standardBooking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (standardBooking) {
        const updated = await prisma_1.default.booking.update({
            where: { id: bookingId },
            data: { clientCompleted: true },
            include: { vendor: true, client: true }, // 👈 so we can notify
        });
        // ✅ notify vendor that client marked completed
        await (0, notifyUser_helper_1.notifyUser)(updated.vendorId, "Booking Update", `Your client has marked booking #${updated.id} as completed.`);
        if (updated.vendorCompleted) {
            await finalizeBookingPayment(updated, creditReference);
        }
        return { ...updated, bookingType: "STANDARD" };
    }
    // Try Service Offer Booking
    const offerBooking = await prisma_1.default.serviceOfferBooking.findUnique({
        where: { id: bookingId },
    });
    if (offerBooking) {
        const updated = await prisma_1.default.serviceOfferBooking.update({
            where: { id: bookingId },
            data: { clientCompleted: true },
            include: { vendor: true, client: true },
        });
        // ✅ notify vendor
        await (0, notifyUser_helper_1.notifyUser)(updated.vendorId, "Booking Update", `Your client has marked service offer booking #${updated.id} as completed.`);
        // ✅ notify client
        await (0, notifyUser_helper_1.notifyUser)(updated.clientId, "Booking Update", `You have successfully marked service offer booking #${updated.id} as completed.`);
        if (updated.vendorCompleted) {
            await finalizeServiceOfferBookingPayment(updated, creditReference);
        }
        return { ...updated, bookingType: "SERVICE_OFFER" };
    }
    // If neither booking type was found
    throw new Error("Booking not found");
};
exports.markBookingCompletedByClient = markBookingCompletedByClient;
const markBookingCompletedByVendor = async (bookingId, creditReference) => {
    // Standard Booking
    const standardBooking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (standardBooking) {
        const updated = await prisma_1.default.booking.update({
            where: { id: bookingId },
            data: { vendorCompleted: true },
        });
        if (updated.clientCompleted) {
            await finalizeBookingPayment(updated, creditReference);
        }
        return { ...updated, bookingType: "STANDARD" };
    }
    // Service Offer Booking
    const offerBooking = await prisma_1.default.serviceOfferBooking.findUnique({ where: { id: bookingId } });
    if (!offerBooking)
        throw new Error("Booking not found");
    const updated = await prisma_1.default.serviceOfferBooking.update({
        where: { id: bookingId },
        data: { vendorCompleted: true },
    });
    if (updated.clientCompleted) {
        await finalizeServiceOfferBookingPayment(updated, creditReference);
    }
    return { ...updated, bookingType: "SERVICE_OFFER" };
};
exports.markBookingCompletedByVendor = markBookingCompletedByVendor;
const finalizeBookingPayment = async (booking, reference) => {
    if (booking.paymentStatus !== client_1.PaymentStatus.LOCKED) {
        throw new Error("Booking payment is not locked or already finalized");
    }
    const vendorWallet = await (0, wallet_service_1.getUserWallet)(booking.vendorId);
    if (!vendorWallet)
        throw new Error("Vendor wallet not found");
    await (0, wallet_service_1.creditWallet)(prisma_1.default, vendorWallet.id, booking.totalAmount, "Booking Payment Received", reference);
    // booking.totalAmount
    return await prisma_1.default.booking.update({
        where: { id: booking.id },
        data: {
            paymentStatus: client_1.PaymentStatus.COMPLETED,
            status: client_1.BookingStatus.COMPLETED,
        },
    });
};
const finalizeServiceOfferBookingPayment = async (booking, reference) => {
    if (booking.paymentStatus !== client_1.PaymentStatus.LOCKED) {
        throw new Error("Payment is not locked or already finalized");
    }
    const vendorWallet = await (0, wallet_service_1.getUserWallet)(booking.vendorId);
    if (!vendorWallet)
        throw new Error("Vendor wallet not found");
    await (0, wallet_service_1.creditWallet)(prisma_1.default, vendorWallet.id, booking.price, "Service Offer Booking Payment Received", reference);
    await (0, notification_service_1.createNotification)(booking.vendorId, `You have received payment for a service offer: ${booking.serviceName}`, "BOOKING");
    await (0, notification_service_1.createNotification)(booking.clientId, `Your service offer (${booking.serviceName}) has been completed successfully.`, "BOOKING");
    return await prisma_1.default.serviceOfferBooking.update({
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
    const isClient = role === "CLIENT";
    const filter = isClient ? { clientId: userId } : { vendorId: userId };
    // Standard Bookings
    const standardBookings = await prisma_1.default.booking.findMany({
        where: filter,
        include: {
            dispute: true,
            service: {
                select: {
                    id: true,
                    serviceName: true,
                    servicePrice: true,
                    serviceImage: true,
                },
            },
            client: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    email: true,
                    phone: true,
                },
            },
            vendor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    phone: true,
                    location: true,
                    bio: true,
                    vendorOnboarding: {
                        select: {
                            id: true,
                            serviceType: true,
                            homeServicePrice: true,
                            identityImage: true,
                            registerationNumber: true,
                            businessName: true,
                            bio: true,
                            location: true,
                            servicesOffered: true,
                            profileImage: true,
                            pricing: true,
                            service: true,
                            approvalStatus: true,
                            specialties: true,
                            portfolioImages: true,
                            serviceRadiusKm: true,
                            latitude: true,
                            longitude: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            date: "desc",
        },
    });
    // Service Offer Bookings
    const serviceOfferBookings = await prisma_1.default.serviceOfferBooking.findMany({
        where: filter,
        include: {
            serviceOffer: {
                select: {
                    id: true,
                    serviceName: true,
                    serviceType: true,
                    serviceImage: true,
                    offerAmount: true,
                },
            },
            client: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    phone: true,
                },
            },
            vendor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    phone: true,
                    location: true,
                    bio: true,
                    vendorOnboarding: {
                        select: {
                            id: true,
                            serviceType: true,
                            homeServicePrice: true,
                            identityImage: true,
                            registerationNumber: true,
                            businessName: true,
                            bio: true,
                            location: true,
                            servicesOffered: true,
                            profileImage: true,
                            pricing: true,
                            service: true,
                            approvalStatus: true,
                            specialties: true,
                            portfolioImages: true,
                            serviceRadiusKm: true,
                            latitude: true,
                            longitude: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            date: "desc",
        },
    });
    // Normalize both sets to match a single structure
    const normalizedStandardBookings = standardBookings.map((b) => ({
        ...b,
        bookingType: "STANDARD",
    }));
    const normalizedServiceOfferBookings = serviceOfferBookings.map((b) => ({
        id: b.id,
        service: {
            id: b.serviceOffer?.id,
            serviceName: b.serviceOffer?.serviceName,
            serviceImage: b.serviceOffer?.serviceImage,
            servicePrice: b.serviceOffer?.offerAmount ?? b.price,
        },
        date: b.date,
        time: b.time,
        price: b.price,
        totalAmount: b.totalAmount,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        client: b.client,
        vendor: b.vendor,
        status: b.status,
        reference: b.reference,
        referencePhoto: b.referencePhoto,
        createdAt: b.createdAt,
        bookingType: "SERVICE_OFFER",
        dispute: null, // if you want to support disputes on serviceOfferBooking later
    }));
    // Combine both and sort by date
    const allBookings = [...normalizedStandardBookings, ...normalizedServiceOfferBookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return allBookings;
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
            await (0, wallet_service_1.debitWallet)(wallet.id, totalAmount, "Booking Payment", reference);
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
    // Fetch booking with vendor and vendorOnboarding
    const booking = await prisma_1.default.booking.findUnique({
        where: { id: bookingId },
        include: {
            vendor: {
                include: {
                    vendorOnboarding: true, // include onboarding details here
                },
            },
        },
    });
    if (!booking)
        throw new Error("Booking not found after update");
    if (!booking.clientId)
        throw new Error("Missing clientId for notification");
    // Extract businessName safely
    const businessName = booking.vendor.vendorOnboarding?.businessName ?? "A vendor";
    await prisma_1.default.notification.create({
        data: {
            userId: booking.clientId,
            message: `Your booking "${booking.serviceName}" has been accepted by ${businessName}!`,
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
