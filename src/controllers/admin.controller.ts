import { Request, Response } from "express";
import * as AdminService from "../services/admin.service";
import { Role } from "@prisma/client";
import { sendMail } from "../helpers/email.helper";
import { logAdminAction } from '../utils/adminLogger';
import uploadToCloudinary from "../utils/cloudinary";

// Utility to 
// extract error message safely
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Internal server error";

// ====================== USERS ======================


import { BroadcastAudience, DeductionStartOption } from "@prisma/client";
import { channel } from "process";

import { VendorCommissionSettingService } from "../services/admin.service";


export class VendorCommissionSettingController {
  static async setCommissionRate(req: Request, res: Response) {
    const { userId, commissionRate, deductionStart } = req.body;

    if (!userId || commissionRate === undefined || !deductionStart) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const validOptions = Object.values(DeductionStartOption);
    if (!validOptions.includes(deductionStart)) {
      return res.status(400).json({ message: "Invalid deduction start option" });
    }

    const setting = await VendorCommissionSettingService.setCommissionRate(userId, commissionRate, deductionStart);
    res.json({ message: "Commission setting updated", setting });
  }

  static async getCommissionRate(req: Request, res: Response) {
    const { userId } = req.params;

    const setting = await VendorCommissionSettingService.getCommissionRate(userId);
    if (!setting) return res.status(404).json({ message: "Commission setting not found" });

    res.json(setting);
  }

  static async deleteCommissionSetting(req: Request, res: Response) {
    const { userId } = req.params;

    await VendorCommissionSettingService.deleteCommissionSetting(userId);
    res.json({ message: "Commission setting deleted" });
  }



   static async setCommissionRateForAllVendors(req: Request, res: Response) {
    const { commissionRate, deductionStart } = req.body;

    if (commissionRate === undefined || !deductionStart) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const validOptions = Object.values(DeductionStartOption);
    if (!validOptions.includes(deductionStart)) {
      return res.status(400).json({ message: "Invalid deduction start option" });
    }

    try {
      const result = await VendorCommissionSettingService.setCommissionRateForAllVendors(commissionRate, deductionStart);
      res.json({ message: "Commission settings updated for all vendors", ...result });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}


export const  createBroadcast = async(req: Request, res: Response)=> {
    try {
      const adminId = req.user!.id;
      const { title, message, audience, channel } = req.body;

      if (!title || !message || !audience) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      if (!["CLIENT", "VENDOR", "BOTH"].includes(audience)) {
        return res.status(400).json({ error: "Invalid audience." });
      }

      const result = await AdminService.sendBroadcast(
        adminId,
        title,
        message,
        audience as BroadcastAudience,
        channel
      );

      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error("Broadcast error:", error);
      return res.status(500).json({ error: "Failed to send broadcast." });
    }
  }


export const getAllBroadcasts = async (req: Request, res: Response) => {
  try {
    const broadcasts = await AdminService.getAllBroadcasts();
    return res.status(200).json({ success: true, broadcasts });
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    return res.status(500).json({ error: "Failed to retrieve broadcasts." });
  }
};


export const getAllUsers = async (req: Request, res: Response) => {

  try {
    const users = await AdminService.getAllUsers();

      await logAdminAction(req.user!.id, 'VIEW_ALL_USERS', 'Admin fetched all client users');

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getUserDetail = async (req: Request, res: Response) => {
  try {
    const user = await AdminService.getUserDetail(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });


    await logAdminAction(req.user!.id, 'GET_USER_DETAIL', 'Admin fetched A User Details');

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await AdminService.deleteUser(req.params.userId);
    // await sendMail(user!.email, "Account Deleted", `<p>Your account has been permanently deleted.</p>`);


    await logAdminAction(req.user!.id, 'DELETE_A_USER', 'Admin DELETED A User');


    res.json({ success: true, message: "User deleted", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const user = await AdminService.banUser(req.params.userId);
    await sendMail(user!.email, "Account Suspended", `<p>Your account has been suspended.</p>`);
    res.json({ success: true, message: "User banned", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const unbanUser = async (req: Request, res: Response) => {
  try {
    const user = await AdminService.unbanUser(req.params.userId);
    await sendMail(user!.email, "Account Restored", `<p>Your account has been unbanned.</p>`);
    res.json({ success: true, message: "User unbanned", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const promoteToAdmin = async (req: Request, res: Response) => {
  try {
    const user = await AdminService.promoteUserToAdmin(req.params.userId);
    await sendMail(user!.email, "You're Now an Admin", `<p>You have been granted admin privileges.</p>`);
    res.json({ success: true, message: "User promoted to ADMIN", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getAllUsersByRole = async (req: Request, res: Response) => {
  try {
    const users = await AdminService.getUsersByRole(req.query.role as Role);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(400).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getNewUsersByRange = async (req: Request, res: Response) => {
  try {
    const users = await AdminService.getNewUsersByRange(req.query.range as string);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(400).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getDailyActiveUsers = async (_req: Request, res: Response) => {
  try {
    const users = await AdminService.getDailyActiveUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// ====================== PRODUCTS ======================

export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await AdminService.getAllProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getSoldProducts = async (_req: Request, res: Response) => {
  try {
    const products = await AdminService.getSoldProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(400).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getProductDetail = async (req: Request, res: Response) => {
  try {
    const product = await AdminService.getProductDetail(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await AdminService.deleteProduct(req.params.productId);
    res.json({ success: true, message: "Product deleted", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const approveProduct = async (req: Request, res: Response) => {
  try {
    const product = await AdminService.approveProduct(req.params.productId);
    const vendor = await AdminService.getUserDetail(product.vendorId);
    if (vendor?.email) {
      await sendMail(vendor.email, "Product Approved", `<p>Your product "${product.productName}" has been approved.</p>`);
    }
    res.json({ success: true, message: "Product approved", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const suspendProduct = async (req: Request, res: Response) => {
  try {
    const product = await AdminService.suspendProduct(req.params.productId);
    res.json({ success: true, message: "Product suspended", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const rejectProduct = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const product = await AdminService.rejectProduct(req.params.productId, reason);
    const vendor = await AdminService.getUserDetail(product.vendorId);
    if (vendor?.email) {
      await sendMail(vendor.email, "Product Rejected", `<p>Your product "${product.productName}" was rejected. Reason: ${reason}</p>`);
    }
    res.json({ success: true, message: "Product rejected", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// ====================== DISPUTES ======================

export const getAllDisputes = async (_req: Request, res: Response) => {
  try {
    const disputes = await AdminService.getAllDisputes();
    res.json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const { resolution } = req.body;
    const dispute = await AdminService.resolveDispute(req.params.disputeId, resolution);
    const user = await AdminService.getUserDetail(dispute.raisedById);
    await sendMail(user!.email, "Dispute Resolved", `<p>Your dispute has been resolved: ${resolution}</p>`);
    res.json({ success: true, message: "Dispute resolved", data: dispute });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// ====================== ORDERS ======================

export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await AdminService.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// export const getOrderTrackingInfo = async (req: Request, res: Response) => {
//   try {
//     const order = await AdminService.getOrderTrackingInfo(req.params.orderId);
//     res.json({ success: true, data: order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: getErrorMessage(error) });
//   }
// };

// ====================== PAYMENTS ======================

export const getAllPayments = async (_req: Request, res: Response) => {
  try {
    const payments = await AdminService.getAllPayments();
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// ====================== BOOKINGS ======================

export const getAllBookings = async (_req: Request, res: Response) => {
  try {
    const bookings = await AdminService.getAllBookings();
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getAllBookingsDetailed = async (_req: Request, res: Response) => {
  try {
    const bookings = await AdminService.getAllBookingsDetailed();
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};


export const verifyVendorIdentity = async (req: Request, res: Response) => {
  try {
    const vendor = await AdminService.verifyVendorIdentity(req.params.vendorId);

    await logAdminAction(req.user!.id, 'VERIFY_VENDOR_IDENTITY', `Admin verified identity for vendor ${req.params.vendorId}`);

    res.json({ success: true, message: "Vendor verified", data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};


export const getAllPromotions = async (req: Request, res: Response) => {
  try {
    const promos = await AdminService.getAllPromotions();

    await logAdminAction(req.user!.id, 'VIEW_ALL_PROMOTIONS', 'Admin fetched all promotions');

    res.json({ success: true, data: promos });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const suspendPromotion = async (req: Request, res: Response) => {
  try {
    const promo = await AdminService.suspendPromotion(req.params.promotionId);

    await logAdminAction(req.user!.id, 'SUSPEND_PROMOTION', `Admin suspended promotion ${req.params.promotionId}`);

    res.json({ success: true, message: "Promotion suspended", data: promo });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};


export const deleteReview = async (req: Request, res: Response) => {
  try {
    await AdminService.deleteReview(req.params.reviewId);

    await logAdminAction(req.user!.id, 'DELETE_REVIEW', `Admin deleted review ${req.params.reviewId}`);

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getAllReviewsWithContent = async (req: Request, res: Response) => {
  try {
    const reviews = await AdminService.getAllReviewsWithContent();

    await logAdminAction(req.user!.id, 'VIEW_ALL_REVIEWS', 'Admin fetched all reviews with comments');

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};



export const getAllMessages = async (req: Request, res: Response) => {
  try {
    const messages = await AdminService.getAllMessages();

    await logAdminAction(req.user!.id, 'VIEW_ALL_MESSAGES', 'Admin fetched all messages');

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};



export const getReferralHistory = async (req: Request, res: Response) => {
  try {
    const referrals = await AdminService.getReferralHistory();

    await logAdminAction(req.user!.id, 'VIEW_REFERRALS', 'Admin fetched referral history');

    res.json({ success: true, data: referrals });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};



export const adjustWalletBalance = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const wallet = await AdminService.adjustWalletBalance(req.params.userId, amount);

    await logAdminAction(req.user!.id, 'ADJUST_WALLET_BALANCE', `Admin adjusted wallet for user ${req.params.userId} by ${amount}`);

    res.json({ success: true, message: "Wallet adjusted", data: wallet });
  } catch (error) {
    res.status(400).json({ success: false, message: getErrorMessage(error) });
  }
};



export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const stats = await AdminService.getPlatformStats();

    await logAdminAction(req.user!.id, 'VIEW_PLATFORM_STATS', 'Admin viewed platform statistics');

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};



export const deleteVendorService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const deletedService = await AdminService.deleteVendorService(serviceId);

    await logAdminAction(
      req.user!.id,
      'DELETE_VENDOR_SERVICE',
      `Admin deleted vendor service with ID: ${serviceId}`
    );

    res.status(200).json({
      success: true,
      message: "Vendor service deleted successfully",
      data: deletedService,
    });
  } catch (error: any) {
    console.error("Error deleting vendor service:", error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};



export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await AdminService.getAllNotifications();

    await logAdminAction(req.user!.id, 'VIEW_NOTIFICATIONS', 'Admin fetched all notifications');

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await AdminService.getAllServices();

    await logAdminAction(req.user!.id, 'VIEW_ALL_SERVICES', 'Admin fetched all services');

    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};





export const editProductAsAdmin = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { productName, price, qtyAvailable, description, approvalStatus } = req.body;

  if (!productId || !productName || price === undefined || qtyAvailable === undefined) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      data: { productId, productName, price, qtyAvailable },
    });
  }

  try {
    let pictureUrl: string | undefined;

    if (req.file) {
      const cloudinaryRes = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      pictureUrl = cloudinaryRes.secure_url;
    }

    const updatedProduct = await AdminService.updateProductAsAdmin(
      productId,
      productName,
      Number(price),
      Number(qtyAvailable),
      description,
      pictureUrl,
      approvalStatus
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully by admin",
      data: updatedProduct,
    });
  } catch (err: any) {
    console.error("❌ Error updating product as admin:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update product as admin",
      error: err.message,
    });
  }
};



export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role 
    } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const user = await AdminService.createUser(firstName, lastName, email, password, role, phone);

    return res.status(201).json({
      message: "User created successfully.",
      user
    });
  } catch (error: any) {
    console.error("Create Admin Error:", error);
    return res.status(500).json({ error: error.message || "Something went wrong." });
  }
};


export const updateAdminController = async (req: Request, res: Response) => {
  try {
    const adminId = req.params.id;
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      isBanned,
      powerGiven,
    } = req.body;

    const updated = await AdminService.updateAdmin({
      id: adminId,
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      isBanned,
      powerGiven,
    });

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("❌ Failed to update admin:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update admin",
    });
  }
};


export const addServiceCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    const existing = await AdminService.getAllServiceCategories();
    if (existing.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const category = await AdminService.createServiceCategory(name);
    return res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const fetchServiceCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await AdminService.getAllServiceCategories();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteServiceCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await AdminService.deleteServiceCategoryById(id);
    return res.json({ success: true, message: "Category deleted", data: category });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const fetchAllAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await AdminService.getAllAdmins();
    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export const deleteAdminController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedAdmin = await AdminService.deleteAdmin(id);

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
      data: deletedAdmin,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete admin",
    });
  }
};


export const editAdminController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedAdmin = await AdminService.editAdmin(id, updateData);

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update admin",
    });
  }
};