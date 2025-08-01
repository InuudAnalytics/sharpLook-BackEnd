
import prisma from "../config/prisma"
import { haversineDistanceKm } from "../utils/distance"
import { EditableVendorFields } from "../types/vendor.types";

import { ApprovalStatus } from '@prisma/client';


export const addPortfolioImages = async (userId: string, imageUrls: string[]) => {
  return await prisma.vendorOnboarding.update({
    where: { userId },
    data: {
      portfolioImages: { push: imageUrls },
    },
  })
}


export const getPortfolioImages = async (userId: string) => {
  return await prisma.vendorOnboarding.findUnique({
    where: { userId },
    select: { portfolioImages: true },
  })
}

export const updateVendorSpecialties = async (userId: string, specialties: string[]) => {
  return await prisma.vendorOnboarding.update({
    where: { userId },
    data: { specialties },
  })
}

export const getVendorSpecialties = async (userId: string) => {
  return await prisma.vendorOnboarding.findUnique({
    where: { userId },
    select: { specialties: true },
  })

}


export const setVendorAvailability = async (
  vendorId: string,
  days: string[],
  fromTime: string,
  toTime: string
) => {
  return await prisma.vendorAvailability.upsert({
    where: { vendorId },
    update: { days, fromTime, toTime },
    create: { vendorId, days, fromTime, toTime },
  })
}

export const getVendorAvailability = async (vendorId: string) => {
  return await prisma.vendorAvailability.findUnique({ where: { vendorId } })
}

export const updateServiceRadiusAndLocation = async (
  userId: string,
  radiusKm: number,
  latitude: number,
  longitude: number
) => {
  return await prisma.vendorOnboarding.update({
    where: { userId },
    data: {
      serviceRadiusKm: radiusKm,
      latitude,
      longitude,
    },
  })
}

export const findNearbyVendors = async (
  clientLat: number,
  clientLon: number
) => {
  const allVendors = await prisma.vendorOnboarding.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      serviceRadiusKm: { not: null },
    },
    include: {
      user: {
        include: {
          vendorServices: true,
          products: true,  // fetch all products, filter next
        },
      },
    },
  });

  // Filter vendors by distance and only include approved products
  return allVendors
    .filter((vendor: any) => {
      const { latitude, longitude, serviceRadiusKm } = vendor;
      const distance = haversineDistanceKm(
        clientLat,
        clientLon,
        latitude!,
        longitude!
      );
      return distance <= serviceRadiusKm!;
    })
    .map((vendor: any) => ({
      ...vendor,
      user: {
        ...vendor.user,
        products: (vendor.user.products || []).filter(
          (product: any) => product.approvalStatus === ApprovalStatus.APPROVED
        ),
      },
    }));
};


export const getAllVendorServices = async () => {

 
  const vendors = await prisma.vendorOnboarding.findMany({
    select: { servicesOffered: true },
  })

  const allServices = vendors.flatMap(v => v.servicesOffered)
  const uniqueServices = Array.from(new Set(allServices))

  return uniqueServices
}


export const getVendorsByService = async (service?: string) => {
  if (!service) {
    return await prisma.vendorOnboarding.findMany({
      include: { user: true },
    })
  }

  return await prisma.vendorOnboarding.findMany({
    where: {
      servicesOffered: {
        has: service, 
      },
    },
    include: { user: true },
  })
}



export const updateVendorProfile = async (vendorId: string, data: EditableVendorFields) => {
  return await prisma.vendorOnboarding.update({
    where: { id: vendorId },
    data
  });
};
