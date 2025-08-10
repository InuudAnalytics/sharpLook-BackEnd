"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationController = exports.PushNotificationController = void 0;
const pushNotifications_service_1 = require("../services/pushNotifications.service");
class PushNotificationController {
    async sendTestPush(req, res) {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        try {
            const response = await pushNotifications_service_1.pushNotificationService.sendPushNotification(token, 'Test', 'This is a test push notification.');
            return res.json({ success: true, response });
        }
        catch (error) {
            console.error('Push error:', error);
            return res.status(500).json({ error: 'Push failed', details: error.message });
        }
    }
}
exports.PushNotificationController = PushNotificationController;
exports.pushNotificationController = new PushNotificationController();
