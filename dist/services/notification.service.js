"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyNearbyVendors = exports.deleteNotification = exports.getUserNotifications = exports.createNotification = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const distance_1 = require("../utils/distance");
const pushNotifications_service_1 = require("./pushNotifications.service");
// export const createNotification = async (
//   userId: string,
//   message: string,
//   type: string = "BOOKING"
// ) => {
//   return await prisma.notification.create({
//     data: {
//       userId,
//       message,
//       type,
//     },
//   })
// }
const createNotification = async (userId, message, type = "BOOKING") => {
    // 1 Save the notification to the database
    const notification = await prisma_1.default.notification.create({
        data: {
            userId,
            message,
            type,
        },
    });
    // 2 Get user's FCM token
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
    });
    // 3 Send Firebase push notification
    if (user?.fcmToken) {
        try {
            await pushNotifications_service_1.pushNotificationService.sendPushNotification(user.fcmToken, "New Notification", message);
        }
        catch (error) {
            console.error("Error sending push notification:", error);
        }
    }
    return notification;
};
exports.createNotification = createNotification;
const getUserNotifications = async (userId) => {
    return await prisma_1.default.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};
exports.getUserNotifications = getUserNotifications;
const deleteNotification = async (notificationId) => {
    return await prisma_1.default.notification.delete({
        where: { id: notificationId },
    });
};
exports.deleteNotification = deleteNotification;
const notifyNearbyVendors = async (offer) => {
    const vendors = await prisma_1.default.user.findMany({
        where: {
            role: "VENDOR",
            vendorOnboarding: {
                NOT: {
                    latitude: null,
                },
            },
        },
        include: {
            vendorOnboarding: true,
        },
    });
    const filtered = vendors.filter((vendor) => {
        const coords = vendor.vendorOnboarding;
        if (!coords?.latitude || !coords?.longitude)
            return false;
        const distance = (0, distance_1.haversineDistanceKm)(coords.latitude, coords.longitude, offer.latitude, offer.longitude);
        return distance <= 10;
    });
    if (filtered.length > 0) {
        const notifications = filtered.map((vendor) => ({
            userId: vendor.id,
            type: "NEW_OFFER",
            message: `New service offer near you: ${offer.serviceName}`,
            metadata: { offerId: offer.id },
        }));
        await prisma_1.default.notification.createMany({
            data: notifications,
        });
    }
    else {
        console.log("No nearby vendors found for offer:", offer.id);
        // Notify the user who created the offer
        await prisma_1.default.notification.create({
            data: {
                userId: offer.clientId, // Make sure `offer.clientId` exists
                type: "NO_VENDOR_FOUND",
                message: `No nearby vendors were found for your service offer: ${offer.serviceName}`,
            },
        });
    }
};
exports.notifyNearbyVendors = notifyNearbyVendors;
