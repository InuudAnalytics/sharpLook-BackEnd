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
exports.completeVendorOrderController = exports.getVendorOrders = exports.getMyOrders = exports.checkoutCart = void 0;
const ProductOrderService = __importStar(require("../services/productOrder.service"));
const notification_service_1 = require("../services/notification.service");
const checkoutCart = async (req, res) => {
    const userId = req.user?.id;
    const { reference } = req.body || {};
    const { deliveryType } = req.body;
    if (!deliveryType) {
        res.status(400).json({
            success: false,
            message: 'Delivery Type is Required'
        });
    }
    try {
        const order = await ProductOrderService.checkoutCart(userId, reference, deliveryType);
        await (0, notification_service_1.createNotification)(userId, `Your order of ₦${order.total} was placed successfully.`);
        return res.status(201).json({
            success: true,
            message: reference
                ? "Order placed successfully using SHARP-PAY"
                : "Order placed successfully using wallet",
            data: order,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};
exports.checkoutCart = checkoutCart;
const getMyOrders = async (req, res) => {
    const userId = req.user.id;
    try {
        const userOrders = await ProductOrderService.getClientOrdersWithVendors(userId);
        if (userOrders) {
            return res.status(200).json({
                success: true,
                message: "Orders Gotten",
                data: userOrders
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "An Error Occured",
            error
        });
    }
};
exports.getMyOrders = getMyOrders;
const getVendorOrders = async (req, res) => {
    const userId = req.user.id;
    try {
        const userOrders = await ProductOrderService.getVendorOrders(userId);
        if (userOrders) {
            return res.status(200).json({
                success: true,
                message: "Orders Gotten",
                data: userOrders
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "An Error Occured",
            error
        });
    }
};
exports.getVendorOrders = getVendorOrders;
const completeVendorOrderController = async (req, res) => {
    const userId = req.user?.id;
    const { vendorOrderIds, role } = req.body; // expect an array now
    if (!Array.isArray(vendorOrderIds) || vendorOrderIds.length === 0 || !role) {
        return res.status(400).json({
            success: false,
            message: "vendorOrderIds (array) and role are required",
        });
    }
    try {
        const updatedOrders = await ProductOrderService.completeVendorOrder(vendorOrderIds, // array
        userId, role);
        const allCompletedAndPaid = updatedOrders.every((o) => o.clientCompleted && o.vendorCompleted && o.paidOut);
        return res.status(200).json({
            success: true,
            message: allCompletedAndPaid
                ? "All orders marked complete and payouts processed"
                : "Orders marked complete",
            data: updatedOrders,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};
exports.completeVendorOrderController = completeVendorOrderController;
