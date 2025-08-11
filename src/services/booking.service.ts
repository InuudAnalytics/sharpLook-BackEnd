import prisma from "../config/prisma";
import { BookingStatus, PaymentStatus, Booking, ServiceOfferBooking, } from "@prisma/client";
import { debitWallet, getUserWallet, creditWallet } from "./wallet.service";
import { verifyPayment } from "../utils/paystack"; // if Paystack used
import { createNotification } from "./notification.service";

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
  // Try Standard Booking first
  const standardBooking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (standardBooking) {
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { clientCompleted: true },
    });

    if (updated.vendorCompleted) {
      await finalizeBookingPayment(updated, creditReference);
    }

    return { ...updated, bookingType: "STANDARD" };
  }

  // Try Service Offer Booking
  const offerBooking = await prisma.serviceOfferBooking.findUnique({
    where: { id: bookingId },
  });

  if (offerBooking) {
    const updated = await prisma.serviceOfferBooking.update({
      where: { id: bookingId },
      data: { clientCompleted: true },
    });

    if (updated.vendorCompleted) {
      await finalizeServiceOfferBookingPayment(updated, creditReference);
    }

    return { ...updated, bookingType: "SERVICE_OFFER" };
  }

  // If neither booking type was found
  throw new Error("Booking not found");
};



export const markBookingCompletedByVendor = async (
  bookingId: string,
  creditReference: string
) => {
  // Standard Booking
  const standardBooking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (standardBooking) {
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { vendorCompleted: true },
    });

    if (updated.clientCompleted) {
      await finalizeBookingPayment(updated, creditReference);
    }

    return { ...updated, bookingType: "STANDARD" };
  }

  // Service Offer Booking
  const offerBooking = await prisma.serviceOfferBooking.findUnique({ where: { id: bookingId } });
  if (!offerBooking) throw new Error("Booking not found");

  const updated = await prisma.serviceOfferBooking.update({
    where: { id: bookingId },
    data: { vendorCompleted: true },
  });

  if (updated.clientCompleted) {
    await finalizeServiceOfferBookingPayment(updated, creditReference);
  }

  return { ...updated, bookingType: "SERVICE_OFFER" };
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


const finalizeServiceOfferBookingPayment = async (
  booking: ServiceOfferBooking,
  reference: string
): Promise<ServiceOfferBooking> => {
  if (booking.paymentStatus !== PaymentStatus.LOCKED) {
    throw new Error("Payment is not locked or already finalized");
  }

  const vendorWallet = await getUserWallet(booking.vendorId);
  if (!vendorWallet) throw new Error("Vendor wallet not found");

  await creditWallet(
    prisma,
    vendorWallet.id,
    booking.price,
    "Service Offer Booking Payment Received",
    reference
  );
await createNotification(
  booking.vendorId,
  `You have received payment for a service offer: ${booking.serviceName}`,
  "BOOKING"
);

await createNotification(
  booking.clientId,
  `Your service offer (${booking.serviceName}) has been completed successfully.`,
  "BOOKING"
);

  return await prisma.serviceOfferBooking.update({
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
  const isClient = role === "CLIENT";
  const filter = isClient ? { clientId: userId } : { vendorId: userId };

  // Standard Bookings
  const standardBookings = await prisma.booking.findMany({
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
  const serviceOfferBookings = await prisma.serviceOfferBooking.findMany({
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
const allBookings = [...normalizedStandardBookings, ...normalizedServiceOfferBookings].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

  return allBookings;
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

  // Fetch booking with vendor and vendorOnboarding
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      vendor: {
        include: {
          vendorOnboarding: true, // include onboarding details here
        },
      },
    },
  });

  if (!booking) throw new Error("Booking not found after update");
  if (!booking.clientId) throw new Error("Missing clientId for notification");

  // Extract businessName safely
  const businessName = booking.vendor.vendorOnboarding?.businessName ?? "A vendor";

  await prisma.notification.create({
    data: {
      userId: booking.clientId,
      message: `Your booking "${booking.serviceName}" has been accepted by ${businessName}!`,
      type: "BOOKING",
    },
  });

  return booking;
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
