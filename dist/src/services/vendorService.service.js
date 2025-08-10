"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVendorService = exports.editVendorService = exports.getAllServices = exports.getVendorServices = exports.addVendorService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const addVendorService = async (userId, serviceName, servicePrice, serviceImage, description) => {
    console.log("This is the vendor ID:", userId);
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error(`Vendor with id ${userId} does not exist.`);
    }
    return await prisma_1.default.vendorService.create({
        data: {
            userId,
            serviceName,
            servicePrice,
            serviceImage,
            description,
        },
    });
};
exports.addVendorService = addVendorService;
const getVendorServices = async (userId) => {
    return await prisma_1.default.vendorService.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};
exports.getVendorServices = getVendorServices;
// ✅ Get all services (admin/global purpose)
const getAllServices = async () => {
    return await prisma_1.default.vendorService.findMany({
        include: { vendor: true } // optional, to include vendor info
    });
};
exports.getAllServices = getAllServices;
// ✅ Edit (update) a vendor service
const editVendorService = async (serviceId, updateData) => {
    return await prisma_1.default.vendorService.update({
        where: { id: serviceId },
        data: updateData,
    });
};
exports.editVendorService = editVendorService;
// ✅ Delete a vendor service
const deleteVendorService = async (serviceId) => {
    return await prisma_1.default.vendorService.delete({
        where: { id: serviceId },
    });
};
exports.deleteVendorService = deleteVendorService;
