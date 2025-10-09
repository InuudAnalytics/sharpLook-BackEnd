"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationService = exports.PushNotificationService = void 0;
const firebase_1 = __importDefault(require("../utils/firebase"));
// export class PushNotificationService {
//   async sendPushNotification(token: string, title: string, body: string): Promise<string> {
//     const message = {
//       token,
//       notification: {
//         title,
//         body,
//       },
//     };
//     const response = await admin.messaging().send(message);
//     return response;
//   }
// }
// export const pushNotificationService = new PushNotificationService();
// src/services/pushNotifications.service.ts
class PushNotificationService {
    async sendPushNotification(token, title, body, data = {}) {
        const message = {
            token,
            notification: { title, body },
            data: {
                // Add your custom data (optional)
                click_action: "FLUTTER_NOTIFICATION_CLICK", // for Android & iOS click handling
                type: data.type || "GENERAL",
                roomId: data.roomId || "",
                ...data,
            },
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    channelId: "default_channel_id",
                },
            },
            apns: {
                payload: {
                    aps: {
                        alert: { title, body },
                        sound: "default",
                        contentAvailable: true,
                    },
                },
            },
        };
        try {
            const response = await firebase_1.default.messaging().send(message);
            console.log("Push notification sent:", response);
            return response;
        }
        catch (error) {
            console.error("Error sending push notification:", error.message || error);
            return null;
        }
    }
}
exports.PushNotificationService = PushNotificationService;
exports.pushNotificationService = new PushNotificationService();
