import prisma from "../config/prisma";
import { BookingStatus, PaymentStatus, Booking } from "@prisma/client";
import { debitWallet, getUserWallet, creditWallet } from "./wallet.service";
import { verifyPayment } from "../utils/paystack"; // if Paystack used

export const createBooking = async (
  clientId: string,
  vendorId: string,
  serviceId: string,
  paymentMethod: string,
  serviceName: string,
  price: number,
  totalAmount: number,
  time: string,
  date: string,
  reference: string,
  referencePhoto: string
) => {
  if (paymentMethod === "SHARP-PAY") {
    const wallet = await getUserWallet(clientId);
    if (!wallet || wallet.balance < price) {
      return {
        success: false,
        message: "Insufficient wallet balance",
      };
    }

    await debitWallet(wallet.id, price, "Booking Payment", reference);
  } else {
    // For other payment methods, reference must be provided
    if (!reference || reference.trim() === "") {
      return {
        success: false,
        message: "Payment reference is required for this payment method",
      };
    }
  }

  const booking = await prisma.booking.create({
    data: {
      clientId,
      vendorId,
      serviceId,
      totalAmount,
      paymentMethod,
      paymentStatus: PaymentStatus.LOCKED,
      serviceName,
      date: new Date(date),
      time,
      price,
      status: BookingStatus.PENDING,
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



export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus,
  refundReference?: string // <-- optional reference for refund
) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  if (status === BookingStatus.REJECTED && booking.paymentStatus === PaymentStatus.LOCKED) {
    const wallet = await getUserWallet(booking.clientId!);
    if (!wallet) throw new Error("Client wallet not found");

    if (!refundReference) throw new Error("Refund reference required");

   await creditWallet(prisma, wallet.id, booking.price, "Booking Refund", refundReference);


    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
        paymentStatus: PaymentStatus.REFUNDED,
      },
    });
  }

  if (status === BookingStatus.ACCEPTED) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.ACCEPTED },
    });
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });
};

export const markBookingCompletedByClient = async (
  bookingId: string,
  creditReference: string 
) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { clientCompleted: true },
  });

  if (updated.vendorCompleted) {
    await finalizeBookingPayment(updated, creditReference);
  }

  return updated;
};

export const markBookingCompletedByVendor = async (
  bookingId: string,
  creditReference: string // reference to pass on final credit
) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { vendorCompleted: true },
  });

  if (updated.clientCompleted) {
    await finalizeBookingPayment(updated, creditReference);
  }

  return updated;
};

const finalizeBookingPayment = async (
  booking: Booking,
  reference: string
): Promise<Booking> => {
  if (booking.paymentStatus !== PaymentStatus.LOCKED) {
    
  throw new Error("Booking payment is not locked or already finalized");

  }
  

  const vendorWallet = await getUserWallet(booking.vendorId);
  if (!vendorWallet) throw new Error("Vendor wallet not found");

await creditWallet(prisma, vendorWallet.id, booking.price, "Booking Payment Received", reference);


  return await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: PaymentStatus.COMPLETED,
      status: BookingStatus.COMPLETED,
    },
  });
};

export const getBookingById = async (bookingId: string) => {
  return await prisma.booking.findUnique({
    where: { id: bookingId },
  });
};
export const getUserBookings = async (userId: string, role: "CLIENT" | "VENDOR") => {
  const filter = role === "CLIENT" ? { clientId: userId } : { vendorId: userId };

  const bookings = await prisma.booking.findMany({
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

  return bookings;
};


export const homeServiceCreateBooking = async (
  clientId: string,
  vendorId: string,
  serviceId: string,
  paymentMethod: string,
  serviceName: string,
  price: number,
  totalAmount: number,
  time: string,
  date: string,
  reference: string,
  serviceType: string,
  homeDetails?: {
    serviceLocation?: string;
    fullAddress?: string;
    landmark?: string;
    referencePhoto?: string;
    specialInstruction?: string;
  }
) => {
  try {
    const isHomeService = serviceType === "HOME_SERVICE";

    const baseData: any = {
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
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.LOCKED,
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
      const wallet = await getUserWallet(clientId);
      if (!wallet || wallet.balance < price) {
        return {
          success: false,
          message: "Insufficient wallet balance",
        };
      }

      await debitWallet(wallet.id, totalAmount, "Booking Payment", reference);
    } else {
      // Non-wallet payments must have a reference
      if (!reference || reference.trim() === "") {
        return {
          success: false,
          message: "Payment reference is required for this payment method",
        };
      }
    }

    const booking = await prisma.booking.create({
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

  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
};






export const acceptBooking = async (vendorId: string, bookingId: string) => {
  const updated = await prisma.booking.updateMany({
    where: { id: bookingId, status: BookingStatus.PENDING },
    data: { status: BookingStatus.ACCEPTED, vendorId },
  });

  if (updated.count === 0) throw new Error("Booking not found, unauthorized, or already accepted");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking!.clientId) throw new Error("Missing clientId for notification");
  await prisma.notification.create({
    data: {
     userId: booking!.clientId ?? undefined,

      message: `Your booking "${booking!.serviceName}" has been accepted!`,
      type: "BOOKING",
     
    },
  });

  return booking!;
};


export const payForAcceptedBooking = async (
  clientId: string,
  bookingId: string,
  reference: string,
  paymentMethod: "SHARP-PAY" | "PAYSTACK"
) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.clientId !== clientId) throw new Error("Not found or unauthorized");
  if (booking.status !== BookingStatus.ACCEPTED) throw new Error("Booking not accepted");
  if (booking.paymentStatus !== PaymentStatus.PENDING) throw new Error("Already paid");

  if (paymentMethod === "SHARP-PAY") {
    const wallet = await getUserWallet(clientId);
    if (!wallet || wallet.balance < booking.price) {
      throw new Error("Insufficient wallet balance");
    }
    await debitWallet(wallet.id, booking.price, "Booking Payment", reference);
  }

  if (paymentMethod === "PAYSTACK") {
    const result = await verifyPayment(reference);
    if (result.status !== "success") {
      throw new Error("Payment verification failed");
    }
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: PaymentStatus.LOCKED,
      reference,
    },
  });

  await prisma.notification.create({
    data: {
      userId: booking.vendorId,
      message: `Payment completed for booking "${booking.serviceName}".`,
      type: "BOOKING",
    
    },
  });

  return updated;
};
