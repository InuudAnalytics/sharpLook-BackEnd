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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminController = __importStar(require("../controllers/admin.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const admin_middleware_1 = require("../middlewares/admin.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// Middleware applied to all admin routes
router.use(auth_middleware_1.verifyToken);
// // SUPER ADMIN ONLY 
router.delete("/users/:userId", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.deleteUser);
router.patch("/users/:userId/promote", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.promoteToAdmin);
router.get("/stats", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.getPlatformStats);
router.post("/createAdmin", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.createAdminUser);
router.post("/addServiceCategory", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.addServiceCategory);
router.get("/getAllServiceCategory", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.fetchServiceCategories);
router.delete("/deleteServiceCategory/:id", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.deleteServiceCategory);
router.get("/getAllAdmins", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.fetchAllAdmins);
router.delete("/deleteAdmin/:id", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.deleteAdminController);
router.patch("/editAdmin/:id", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.editAdminController);
router.get("/getAllBroadcast", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.getAllBroadcasts);
router.put("/editAdmin/:id", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), AdminController.updateAdminController);
router.post("/vendor-commission", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), admin_controller_1.VendorCommissionSettingController.setCommissionRate);
router.get("/vendor-commission/:userId", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), admin_controller_1.VendorCommissionSettingController.getCommissionRate);
router.delete("/vendor-commission/:userId", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), admin_controller_1.VendorCommissionSettingController.deleteCommissionSetting);
router.post("/vendor-commission/all", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPERADMIN), admin_controller_1.VendorCommissionSettingController.setCommissionRateForAllVendors);
// // ADMIN AND SUPERADMIN
// // Users
router.get("/users", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getAllUsers);
router.get("/users/role", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getAllUsersByRole);
router.get("/users/new", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getNewUsersByRange);
router.get("/users/active", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getDailyActiveUsers);
router.get("/users/:userId", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getUserDetail);
router.put("/users/:userId/ban", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.banUser);
router.put("/users/:userId/unban", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.unbanUser);
router.get("/users/notifications", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getAllNotifications);
router.get("/services", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getAllServices);
router.post("/broadcasts", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.createBroadcast);
router.put("/products/:productId", upload_middleware_1.uploadSingle2, (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.editProductAsAdmin);
router.delete("/deleteVendorService/:serviceId", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.deleteVendorService);
// Vendors
router.patch("/vendors/:vendorId/verify", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.verifyVendorIdentity);
// Reviews
router.get("/reviews", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getAllReviewsWithContent);
router.delete("/reviews/:reviewId", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.deleteReview);
// Messages
router.get("/messages", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getAllMessages);
// Referrals
router.get("/referrals", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), AdminController.getReferralHistory);
// // FINANCE ADMIN 
// Payments and Wallets
router.get("/payments", (0, admin_middleware_1.requireAdminRole)(client_1.Role.FINANCE_ADMIN, client_1.Role.SUPERADMIN), AdminController.getAllPayments);
router.patch("/wallets/:userId/adjust", (0, admin_middleware_1.requireAdminRole)(client_1.Role.FINANCE_ADMIN, client_1.Role.SUPERADMIN), AdminController.adjustWalletBalance);
// // ANALYST 
// Bookings, Orders
router.get("/bookings", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ANALYST, client_1.Role.SUPERADMIN), AdminController.getAllBookings);
router.get("/bookings/details", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ANALYST, client_1.Role.SUPERADMIN), AdminController.getAllBookingsDetailed);
router.get("/orders", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ANALYST, client_1.Role.SUPERADMIN), AdminController.getAllOrders);
// // CONTENT MANAGER
// // Product moderation
router.get("/products", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.getAllProducts);
router.get("/products/sold", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.getSoldProducts);
router.get("/products/:productId", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.getProductDetail);
router.delete("/products/:productId", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.deleteProduct);
router.patch("/products/:productId/approve", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.approveProduct);
router.patch("/products/:productId/suspend", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.suspendProduct);
router.patch("/products/:productId/reject", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.rejectProduct);
// Promotions
router.get("/promotions", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.getAllPromotions);
router.patch("/promotions/:promotionId/suspend", (0, admin_middleware_1.requireAdminRole)(client_1.Role.CONTENT_MANAGER, client_1.Role.SUPERADMIN), AdminController.suspendPromotion);
// // SUPPORT ADMIN
// Dispute resolution
router.get("/disputes", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPPORT, client_1.Role.SUPERADMIN), AdminController.getAllDisputes);
router.patch("/disputes/:disputeId/resolve", (0, admin_middleware_1.requireAdminRole)(client_1.Role.SUPPORT, client_1.Role.SUPERADMIN), AdminController.resolveDispute);
exports.default = router;
