"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const pushNotifications_service_1 = require("../services/pushNotifications.service");
const notifyUser = async (userId, title, body) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { fcmToken: true },
        });
        if (user?.fcmToken) {
            await pushNotifications_service_1.pushNotificationService.sendPushNotification(user.fcmToken, title, body);
        }
        else {
            console.log(`No FCM token found for user ${userId}, skipping push notification.`);
        }
    }
    catch (error) {
        console.error(`Failed to send push notification to user ${userId}:`, error);
    }
};
exports.notifyUser = notifyUser;
