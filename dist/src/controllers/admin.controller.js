"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editAdminController = exports.deleteAdminController = exports.fetchAllAdmins = exports.deleteServiceCategory = exports.fetchServiceCategories = exports.addServiceCategory = exports.updateAdminController = exports.createAdminUser = exports.editProductAsAdmin = exports.getAllServices = exports.getAllNotifications = exports.deleteVendorService = exports.getPlatformStats = exports.adjustWalletBalance = exports.getReferralHistory = exports.getAllMessages = exports.getAllReviewsWithContent = exports.deleteReview = exports.suspendPromotion = exports.getAllPromotions = exports.verifyVendorIdentity = exports.getAllBookingsDetailed = exports.getAllBookings = exports.getAllPayments = exports.getAllOrders = exports.resolveDispute = exports.getAllDisputes = exports.rejectProduct = exports.suspendProduct = exports.approveProduct = exports.deleteProduct = exports.getProductDetail = exports.getSoldProducts = exports.getAllProducts = exports.getDailyActiveUsers = exports.getNewUsersByRange = exports.getAllUsersByRole = exports.promoteToAdmin = exports.unbanUser = exports.banUser = exports.deleteUser = exports.getUserDetail = exports.getAllUsers = exports.getAllBroadcasts = exports.createBroadcast = exports.VendorCommissionSettingController = void 0;
const AdminService = __importStar(require("../services/admin.service"));
const email_helper_1 = require("../helpers/email.helper");
const adminLogger_1 = require("../utils/adminLogger");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
// Utility to extract error message safely
const getErrorMessage = (error) => error instanceof Error ? error.message : "Internal server error";
// ====================== USERS ======================
const client_1 = require("@prisma/client");
const admin_service_1 = require("../services/admin.service");
class VendorCommissionSettingController {
    static async setCommissionRate(req, res) {
        const { userId, commissionRate, deductionStart } = req.body;
        if (!userId || commissionRate === undefined || !deductionStart) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const validOptions = Object.values(client_1.DeductionStartOption);
        if (!validOptions.includes(deductionStart)) {
            return res.status(400).json({ message: "Invalid deduction start option" });
        }
        const setting = await admin_service_1.VendorCommissionSettingService.setCommissionRate(userId, commissionRate, deductionStart);
        res.json({ message: "Commission setting updated", setting });
    }
    static async getCommissionRate(req, res) {
        const { userId } = req.params;
        const setting = await admin_service_1.VendorCommissionSettingService.getCommissionRate(userId);
        if (!setting)
            return res.status(404).json({ message: "Commission setting not found" });
        res.json(setting);
    }
    static async deleteCommissionSetting(req, res) {
        const { userId } = req.params;
        await admin_service_1.VendorCommissionSettingService.deleteCommissionSetting(userId);
        res.json({ message: "Commission setting deleted" });
    }
    static async setCommissionRateForAllVendors(req, res) {
        const { commissionRate, deductionStart } = req.body;
        if (commissionRate === undefined || !deductionStart) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const validOptions = Object.values(client_1.DeductionStartOption);
        if (!validOptions.includes(deductionStart)) {
            return res.status(400).json({ message: "Invalid deduction start option" });
        }
        try {
            const result = await admin_service_1.VendorCommissionSettingService.setCommissionRateForAllVendors(commissionRate, deductionStart);
            res.json({ message: "Commission settings updated for all vendors", ...result });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.VendorCommissionSettingController = VendorCommissionSettingController;
const createBroadcast = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { title, message, audience, channel } = req.body;
        if (!title || !message || !audience) {
            return res.status(400).json({ error: "Missing required fields." });
        }
        if (!["CLIENT", "VENDOR", "BOTH"].includes(audience)) {
            return res.status(400).json({ error: "Invalid audience." });
        }
        const result = await AdminService.sendBroadcast(adminId, title, message, audience, channel);
        return res.status(200).json({ success: true, ...result });
    }
    catch (error) {
        console.error("Broadcast error:", error);
        return res.status(500).json({ error: "Failed to send broadcast." });
    }
};
exports.createBroadcast = createBroadcast;
const getAllBroadcasts = async (req, res) => {
    try {
        const broadcasts = await AdminService.getAllBroadcasts();
        return res.status(200).json({ success: true, broadcasts });
    }
    catch (error) {
        console.error("Error fetching broadcasts:", error);
        return res.status(500).json({ error: "Failed to retrieve broadcasts." });
    }
};
exports.getAllBroadcasts = getAllBroadcasts;
const getAllUsers = async (req, res) => {
    try {
        const users = await AdminService.getAllUsers();
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VIEW_ALL_USERS', 'Admin fetched all client users');
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllUsers = getAllUsers;
const getUserDetail = async (req, res) => {
    try {
        const user = await AdminService.getUserDetail(req.params.userId);
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'GET_USER_DETAIL', 'Admin fetched A User Details');
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getUserDetail = getUserDetail;
const deleteUser = async (req, res) => {
    try {
        const user = await AdminService.deleteUser(req.params.userId);
        // await sendMail(user!.email, "Account Deleted", `<p>Your account has been permanently deleted.</p>`);
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'DELETE_A_USER', 'Admin DELETED A User');
        res.json({ success: true, message: "User deleted", data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.deleteUser = deleteUser;
const banUser = async (req, res) => {
    try {
        const user = await AdminService.banUser(req.params.userId);
        await (0, email_helper_1.sendMail)(user.email, "Account Suspended", `<p>Your account has been suspended.</p>`);
        res.json({ success: true, message: "User banned", data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.banUser = banUser;
const unbanUser = async (req, res) => {
    try {
        const user = await AdminService.unbanUser(req.params.userId);
        await (0, email_helper_1.sendMail)(user.email, "Account Restored", `<p>Your account has been unbanned.</p>`);
        res.json({ success: true, message: "User unbanned", data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.unbanUser = unbanUser;
const promoteToAdmin = async (req, res) => {
    try {
        const user = await AdminService.promoteUserToAdmin(req.params.userId);
        await (0, email_helper_1.sendMail)(user.email, "You're Now an Admin", `<p>You have been granted admin privileges.</p>`);
        res.json({ success: true, message: "User promoted to ADMIN", data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.promoteToAdmin = promoteToAdmin;
const getAllUsersByRole = async (req, res) => {
    try {
        const users = await AdminService.getUsersByRole(req.query.role);
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(400).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllUsersByRole = getAllUsersByRole;
const getNewUsersByRange = async (req, res) => {
    try {
        const users = await AdminService.getNewUsersByRange(req.query.range);
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(400).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getNewUsersByRange = getNewUsersByRange;
const getDailyActiveUsers = async (_req, res) => {
    try {
        const users = await AdminService.getDailyActiveUsers();
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getDailyActiveUsers = getDailyActiveUsers;
// ====================== PRODUCTS ======================
const getAllProducts = async (_req, res) => {
    try {
        const products = await AdminService.getAllProducts();
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllProducts = getAllProducts;
const getSoldProducts = async (_req, res) => {
    try {
        const products = await AdminService.getSoldProducts();
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(400).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getSoldProducts = getSoldProducts;
const getProductDetail = async (req, res) => {
    try {
        const product = await AdminService.getProductDetail(req.params.productId);
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getProductDetail = getProductDetail;
const deleteProduct = async (req, res) => {
    try {
        const product = await AdminService.deleteProduct(req.params.productId);
        res.json({ success: true, message: "Product deleted", data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.deleteProduct = deleteProduct;
const approveProduct = async (req, res) => {
    try {
        const product = await AdminService.approveProduct(req.params.productId);
        const vendor = await AdminService.getUserDetail(product.vendorId);
        if (vendor?.email) {
            await (0, email_helper_1.sendMail)(vendor.email, "Product Approved", `<p>Your product "${product.productName}" has been approved.</p>`);
        }
        res.json({ success: true, message: "Product approved", data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.approveProduct = approveProduct;
const suspendProduct = async (req, res) => {
    try {
        const product = await AdminService.suspendProduct(req.params.productId);
        res.json({ success: true, message: "Product suspended", data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.suspendProduct = suspendProduct;
const rejectProduct = async (req, res) => {
    try {
        const { reason } = req.body;
        const product = await AdminService.rejectProduct(req.params.productId, reason);
        const vendor = await AdminService.getUserDetail(product.vendorId);
        if (vendor?.email) {
            await (0, email_helper_1.sendMail)(vendor.email, "Product Rejected", `<p>Your product "${product.productName}" was rejected. Reason: ${reason}</p>`);
        }
        res.json({ success: true, message: "Product rejected", data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.rejectProduct = rejectProduct;
// ====================== DISPUTES ======================
const getAllDisputes = async (_req, res) => {
    try {
        const disputes = await AdminService.getAllDisputes();
        res.json({ success: true, data: disputes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllDisputes = getAllDisputes;
const resolveDispute = async (req, res) => {
    try {
        const { resolution } = req.body;
        const dispute = await AdminService.resolveDispute(req.params.disputeId, resolution);
        const user = await AdminService.getUserDetail(dispute.raisedById);
        await (0, email_helper_1.sendMail)(user.email, "Dispute Resolved", `<p>Your dispute has been resolved: ${resolution}</p>`);
        res.json({ success: true, message: "Dispute resolved", data: dispute });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.resolveDispute = resolveDispute;
// ====================== ORDERS ======================
const getAllOrders = async (_req, res) => {
    try {
        const orders = await AdminService.getAllOrders();
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllOrders = getAllOrders;
// export const getOrderTrackingInfo = async (req: Request, res: Response) => {
//   try {
//     const order = await AdminService.getOrderTrackingInfo(req.params.orderId);
//     res.json({ success: true, data: order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: getErrorMessage(error) });
//   }
// };
// ====================== PAYMENTS ======================
const getAllPayments = async (_req, res) => {
    try {
        const payments = await AdminService.getAllPayments();
        res.json({ success: true, data: payments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllPayments = getAllPayments;
// ====================== BOOKINGS ======================
const getAllBookings = async (_req, res) => {
    try {
        const bookings = await AdminService.getAllBookings();
        res.json({ success: true, data: bookings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllBookings = getAllBookings;
const getAllBookingsDetailed = async (_req, res) => {
    try {
        const bookings = await AdminService.getAllBookingsDetailed();
        res.json({ success: true, data: bookings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllBookingsDetailed = getAllBookingsDetailed;
const verifyVendorIdentity = async (req, res) => {
    try {
        const vendor = await AdminService.verifyVendorIdentity(req.params.vendorId);
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VERIFY_VENDOR_IDENTITY', `Admin verified identity for vendor ${req.params.vendorId}`);
        res.json({ success: true, message: "Vendor verified", data: vendor });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.verifyVendorIdentity = verifyVendorIdentity;
const getAllPromotions = async (req, res) => {
    try {
        const promos = await AdminService.getAllPromotions();
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VIEW_ALL_PROMOTIONS', 'Admin fetched all promotions');
        res.json({ success: true, data: promos });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllPromotions = getAllPromotions;
const suspendPromotion = async (req, res) => {
    try {
        const promo = await AdminService.suspendPromotion(req.params.promotionId);
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'SUSPEND_PROMOTION', `Admin suspended promotion ${req.params.promotionId}`);
        res.json({ success: true, message: "Promotion suspended", data: promo });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.suspendPromotion = suspendPromotion;
const deleteReview = async (req, res) => {
    try {
        await AdminService.deleteReview(req.params.reviewId);
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'DELETE_REVIEW', `Admin deleted review ${req.params.reviewId}`);
        res.json({ success: true, message: "Review deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.deleteReview = deleteReview;
const getAllReviewsWithContent = async (req, res) => {
    try {
        const reviews = await AdminService.getAllReviewsWithContent();
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VIEW_ALL_REVIEWS', 'Admin fetched all reviews with comments');
        res.json({ success: true, data: reviews });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllReviewsWithContent = getAllReviewsWithContent;
const getAllMessages = async (req, res) => {
    try {
        const messages = await AdminService.getAllMessages();
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VIEW_ALL_MESSAGES', 'Admin fetched all messages');
        res.json({ success: true, data: messages });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllMessages = getAllMessages;
const getReferralHistory = async (req, res) => {
    try {
        const referrals = await AdminService.getReferralHistory();
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VIEW_REFERRALS', 'Admin fetched referral history');
        res.json({ success: true, data: referrals });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getReferralHistory = getReferralHistory;
const adjustWalletBalance = async (req, res) => {
    try {
        const { amount } = req.body;
        const wallet = await AdminService.adjustWalletBalance(req.params.userId, amount);
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'ADJUST_WALLET_BALANCE', `Admin adjusted wallet for user ${req.params.userId} by ${amount}`);
        res.json({ success: true, message: "Wallet adjusted", data: wallet });
    }
    catch (error) {
        res.status(400).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.adjustWalletBalance = adjustWalletBalance;
const getPlatformStats = async (req, res) => {
    try {
        const stats = await AdminService.getPlatformStats();
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VIEW_PLATFORM_STATS', 'Admin viewed platform statistics');
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getPlatformStats = getPlatformStats;
const deleteVendorService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const deletedService = await AdminService.deleteVendorService(serviceId);
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'DELETE_VENDOR_SERVICE', `Admin deleted vendor service with ID: ${serviceId}`);
        res.status(200).json({
            success: true,
            message: "Vendor service deleted successfully",
            data: deletedService,
        });
    }
    catch (error) {
        console.error("Error deleting vendor service:", error);
        res.status(500).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
};
exports.deleteVendorService = deleteVendorService;
const getAllNotifications = async (req, res) => {
    try {
        const notifications = await AdminService.getAllNotifications();
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VIEW_NOTIFICATIONS', 'Admin fetched all notifications');
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllNotifications = getAllNotifications;
const getAllServices = async (req, res) => {
    try {
        const services = await AdminService.getAllServices();
        await (0, adminLogger_1.logAdminAction)(req.user.id, 'VIEW_ALL_SERVICES', 'Admin fetched all services');
        res.json({ success: true, data: services });
    }
    catch (error) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};
exports.getAllServices = getAllServices;
const editProductAsAdmin = async (req, res) => {
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
        let pictureUrl;
        if (req.file) {
            const cloudinaryRes = await (0, cloudinary_1.default)(req.file.buffer, req.file.mimetype);
            pictureUrl = cloudinaryRes.secure_url;
        }
        const updatedProduct = await AdminService.updateProductAsAdmin(productId, productName, Number(price), Number(qtyAvailable), description, pictureUrl, approvalStatus);
        return res.status(200).json({
            success: true,
            message: "Product updated successfully by admin",
            data: updatedProduct,
        });
    }
    catch (err) {
        console.error("❌ Error updating product as admin:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update product as admin",
            error: err.message,
        });
    }
};
exports.editProductAsAdmin = editProductAsAdmin;
const createAdminUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, role } = req.body;
        if (!firstName || !lastName || !email || !password || !role) {
            return res.status(400).json({ error: "Missing required fields." });
        }
        const user = await AdminService.createUser(firstName, lastName, email, password, role, phone);
        return res.status(201).json({
            message: "User created successfully.",
            user
        });
    }
    catch (error) {
        console.error("Create Admin Error:", error);
        return res.status(500).json({ error: error.message || "Something went wrong." });
    }
};
exports.createAdminUser = createAdminUser;
const updateAdminController = async (req, res) => {
    try {
        const adminId = req.params.id;
        const { firstName, lastName, email, phone, password, role, isBanned, powerGiven, } = req.body;
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
    }
    catch (error) {
        console.error("❌ Failed to update admin:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update admin",
        });
    }
};
exports.updateAdminController = updateAdminController;
const addServiceCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ success: false, message: "Name is required" });
        const existing = await AdminService.getAllServiceCategories();
        if (existing.find(c => c.name.toLowerCase() === name.toLowerCase())) {
            return res.status(409).json({ success: false, message: "Category already exists" });
        }
        const category = await AdminService.createServiceCategory(name);
        return res.status(201).json({ success: true, data: category });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.addServiceCategory = addServiceCategory;
const fetchServiceCategories = async (_req, res) => {
    try {
        const categories = await AdminService.getAllServiceCategories();
        res.json({ success: true, data: categories });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.fetchServiceCategories = fetchServiceCategories;
const deleteServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await AdminService.deleteServiceCategoryById(id);
        return res.json({ success: true, message: "Category deleted", data: category });
    }
    catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteServiceCategory = deleteServiceCategory;
const fetchAllAdmins = async (req, res) => {
    try {
        const admins = await AdminService.getAllAdmins();
        res.status(200).json({ success: true, data: admins });
    }
    catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.fetchAllAdmins = fetchAllAdmins;
const deleteAdminController = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAdmin = await AdminService.deleteAdmin(id);
        res.status(200).json({
            success: true,
            message: "Admin deleted successfully",
            data: deletedAdmin,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to delete admin",
        });
    }
};
exports.deleteAdminController = deleteAdminController;
const editAdminController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedAdmin = await AdminService.editAdmin(id, updateData);
        res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update admin",
        });
    }
};
exports.editAdminController = editAdminController;
