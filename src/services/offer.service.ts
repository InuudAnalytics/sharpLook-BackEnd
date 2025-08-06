import prisma from "../config/prisma";
import * as bookingService from "../services/booking.service"
import { BookingStatus, PaymentStatus, Booking } from "@prisma/client";

import * as serviceOfferBookingService from "../services/offerBooking.service";
import { createNotification } from "./notification.service";

import { getUserWallet, debitWallet } from "../services/wallet.service";
import {generateReference} from "../utils/paystack"
import { ApprovalStatus } from '@prisma/client';



export const createServiceOffer = async (
  clientId: string,
  data: any,
  serviceImage: string
) => {
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

  return await prisma.serviceOffer.create({
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
      landMark : data.landMark,
      fullAddress : data.fullAddress,
      paymentMethod: data.paymentMethod,
      totalAmount : data.totalAmount ? parseFloat(data.totalAmount) : undefined,
    },
  });
};



export const getVendorsForOffer = async (offerId: string) => {
  const vendors = await prisma.vendorOffer.findMany({
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
    const approvedProducts = vendor.products.filter(
      (product) => product.approvalStatus === ApprovalStatus.APPROVED
    );

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


export const vendorAcceptOffer = async (
  vendorId: string,
  offerId: string,
  price: number
) => {
  // Check if vendor already accepted this offer
  const existing = await prisma.vendorOffer.findFirst({
    where: {
      vendorId,
      serviceOfferId: offerId,
    },
  });

  if (existing) {
    throw new Error("You’ve already accepted this offer.");
  }

  // Fetch offer details
  const offer = await prisma.serviceOffer.findUnique({
    where: { id: offerId },
    select: {
      clientId: true,
      serviceName: true,
    },
  });

  if (!offer) throw new Error("Offer not found");

  const { clientId, serviceName } = offer;

  // Fetch vendor details from User model
  const vendor = await prisma.user.findUnique({
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

  if (!vendor) throw new Error("Vendor not found");

  const vendorName = `${vendor.firstName} ${vendor.lastName}`;
  const vendorDisplayName = vendor.vendorOnboarding?.businessName
    ? `${vendorName} (${vendor.vendorOnboarding.businessName})`
    : vendorName;

  // Send notification to client with vendor info
  await createNotification(
    clientId,
    `${vendorDisplayName} has accepted your request for "${serviceName}".`
  );

  // Create vendor offer record
  await prisma.vendorOffer.create({
    data: {
      vendorId,
      serviceOfferId: offerId,
      price,
      isAccepted: true, // Optionally mark accepted immediately
    },
  });

  return { success: true, message: "Offer accepted and client notified." };
};




export const selectVendorForOffer = async (
  offerId: string,
  selectedVendorId: string,
  reference: string,
  paymentMethod: string,
  totalAmount: number,
) => {
  try {
    // 1. Update offer with selection and payment info
    await prisma.serviceOffer.update({
      where: { id: offerId },
      data: {
        status: "SELECTED",
        reference,
        paymentMethod,
        totalAmount,
        
      },
    });

    // 2. Reset all vendorOffer.isAccepted to false
    await prisma.vendorOffer.updateMany({
      where: { serviceOfferId: offerId },
      data: { isAccepted: false },
    });

    // 3. Mark selected vendor's offer as accepted
    await prisma.vendorOffer.updateMany({
      where: {
        serviceOfferId: offerId,
        vendorId: selectedVendorId,
      },
      data: { isAccepted: true },
    });

    // 4. Fetch full offer
    const offer = await prisma.serviceOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) throw new Error("Offer not found");

    const {
      id: serviceOfferId,
      clientId,
      serviceType,
      offerAmount,
      serviceName,
      date,
      time,
      referencePhoto,
      specialInstruction,
      serviceImage,
      homeLocation,
      fullAddress,
      landMark,
      
    } = offer;

    // if (!totalAmount) throw new Error("Total amount missing");
    if (!selectedVendorId) throw new Error("Selected vendor ID missing");

    const finalPaymentMethod = paymentMethod;

    const finalReference = reference 
    const transactionReference = generateReference(); // 🔐 Ensure unique wallet reference


    console.log(finalReference);
    
    // 5. Get price from vendorOffer
    const vendorOffer = await prisma.vendorOffer.findFirst({
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
      const wallet = await getUserWallet(clientId);
      if (!wallet || wallet.balance < price) {
        return {
          success: false,
          message: "Insufficient wallet balance",
        };
      }
        reference = transactionReference
      await debitWallet(wallet.id, price, "Offer Booking Payment", reference);
    } else {
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
    await prisma.notification.create({
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
  } catch (error: unknown) {
    console.error("❌ Error in selectVendorForOffer:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error selecting vendor",
    };
  }
};




const EARTH_RADIUS_KM = 6371;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export const getNearbyOffersByCoordinates = async (vendorId: string) => {
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: {
      vendorOnboarding: true,
    },
  });

  if (
    !vendor?.vendorOnboarding?.latitude ||
    !vendor?.vendorOnboarding?.longitude
  ) {
    throw new Error("Vendor coordinates not found.");
  }

 const allOffers = await prisma.serviceOffer.findMany({
  where: {
    status: "PENDING",
    expiresAt: { gte: new Date() }, 
  },
  include: {
    client: true,
  },
});

  const nearbyOffers = allOffers.filter((offer: any) => {
    if (!offer.latitude || !offer.longitude) return false;

    const distance = haversineDistance(
      vendor.vendorOnboarding!.latitude!,
      vendor.vendorOnboarding!.longitude!,
      offer.latitude,
      offer.longitude
    );

    return distance <= 10; // limit to 10km radius
  });

  return nearbyOffers;
};


export const cancelOffer = async (offerId: string, clientId: string) => {
  return await prisma.serviceOffer.updateMany({
    where: { id: offerId, clientId },
    data: { status: "CANCELLED" },
  });
};


export const getAllAvailableOffers = async () => {
  return prisma.serviceOffer.findMany({
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

export const getClientOffers = async (clientId: string) => {
  return await prisma.serviceOffer.findMany({
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


export const addTipToOffer = async (clientId: string, offerId: string, tipAmount: number) => {
  const offer = await prisma.serviceOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer) throw new Error("Offer not found");
  if (offer.clientId !== clientId) throw new Error("Unauthorized action");

  const newAmount = Number(offer.offerAmount) + Number(tipAmount);

  return await prisma.serviceOffer.update({
    where: { id: offerId },
    data: { offerAmount: newAmount },
  });
};
