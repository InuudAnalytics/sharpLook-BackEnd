"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/notifications.routes.js
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// ✅ Update token
router.post('/update-token', async (req, res) => {
    const { userId, fcmToken } = req.body;
    if (!userId || !fcmToken) {
        return res.status(400).json({ error: 'userId and fcmToken are required' });
    }
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { fcmToken },
        });
        res.json({ success: true, message: 'FCM token updated' });
    }
    catch (error) {
        console.error('Error updating token:', error);
        res.status(500).json({ error: 'Failed to update token' });
    }
});
router.use(auth_middleware_1.verifyToken);
// ✅ Send notification
router.post('/send', async (req, res) => {
    const userId = req.user.id;
    const { title, message } = req.body;
    if (!userId || !title || !message) {
        return res.status(400).json({ error: 'userId, title, and message are required' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fcmToken: true },
        });
        if (!user?.fcmToken) {
            return res.status(404).json({ error: 'User token not found' });
        }
        const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: user.fcmToken,
                title,
                body: message,
                data: { userId },
            }),
        });
        const result = await expoResponse.json();
        res.json({ success: true, expo: result });
    }
    catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'Notification failed' });
    }
});
exports.default = router;
