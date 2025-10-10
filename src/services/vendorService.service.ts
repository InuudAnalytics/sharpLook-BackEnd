import prisma from "../config/prisma"

export const addVendorService = async (
  userId: string,
  serviceName: string,
  servicePrice: number,
  serviceImage: string,
  description: string,
) => {

   

  console.log("This is the vendor ID:", userId);
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`Vendor with id ${userId} does not exist.`);
  }

  return await prisma.vendorService.create({
    data: {
      
      userId,
      serviceName,
      servicePrice,
      serviceImage,
      description,
    },
  });
};

export const getVendorServices = async (userId: string) => {
 
  
  return await prisma.vendorService.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {vendor : true } // update the vendor to the services
  })
}


// ✅ Get all services (admin/global purpose)
export const getAllServices = async () => {
  return await prisma.vendorService.findMany({
    include: { vendor: true } // optional, to include vendor info
  });
};

// ✅ Edit (update) a vendor service
export const editVendorService = async (
  serviceId: string,
  updateData: {
    serviceName?: string;
    servicePrice?: number;
    serviceImage?: string;
  }
) => {
  return await prisma.vendorService.update({
    where: { id: serviceId },
    data: updateData,
  });
};

// ✅ Delete a vendor service
export const deleteVendorService = async (serviceId: string) => {
  return await prisma.vendorService.delete({
    where: { id: serviceId },
  });
};


