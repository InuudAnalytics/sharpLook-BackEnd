"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import admin from './config/firebase';
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const router = express_1.default.Router();
router.post('/test-notification', async (req, res) => {
    const { fcmToken } = req.body;
    try {
        const response = await firebase_admin_1.default.messaging().send({
            token: fcmToken,
            notification: {
                title: 'Test Notification',
                body: 'This is a test push from SharpLook backend 🚀',
            },
        });
        res.json({ success: true, response });
    }
    catch (error) {
        console.error("FCM Error:", error);
        res.json({ success: false, error: error.message });
    }
});
exports.default = router;
