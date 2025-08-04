"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestPush = sendTestPush;
// routes/api/testPush.ts
const firebase_1 = __importDefault(require("../utils/firebase"));
async function sendTestPush(req, res) {
    const { token } = req.body;
    try {
        const response = await firebase_1.default.messaging().send({
            token,
            notification: {
                title: 'Test',
                body: 'This is a test push notification.',
            },
        });
        return res.json({ success: true, response });
    }
    catch (error) {
        console.error('Push error:', error);
        return res.status(500).json({ error: 'Push failed' });
    }
}
