"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationService = exports.PushNotificationService = void 0;
// src/services/pushNotification.service.ts
const firebase_1 = __importDefault(require("../utils/firebase"));
class PushNotificationService {
    async sendPushNotification(token, title, body) {
        const message = {
            token,
            notification: {
                title,
                body,
            },
        };
        const response = await firebase_1.default.messaging().send(message);
        return response;
    }
}
exports.PushNotificationService = PushNotificationService;
exports.pushNotificationService = new PushNotificationService();
