"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationController = exports.getNotifications = exports.sendTestNotification = void 0;
const notification_service_1 = require("../services/notification.service");
const library_1 = require("@prisma/client/runtime/library");
const sendTestNotification = async (req, res) => {
    try {
        const { userId, message, type } = req.body;
        const notification = await (0, notification_service_1.createNotification)(userId, message, type);
        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: notification
        });
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.sendTestNotification = sendTestNotification;
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await (0, notification_service_1.getUserNotifications)(userId);
        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getNotifications = getNotifications;
const deleteNotificationController = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        await (0, notification_service_1.deleteNotification)(notificationId);
        return res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
        });
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientKnownRequestError &&
            error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or already deleted',
            });
        }
        next(error); // let other errors bubble up
    }
};
exports.deleteNotificationController = deleteNotificationController;
