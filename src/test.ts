import express from 'express';
// import admin from './config/firebase';
import admin from 'firebase-admin';


const router = express.Router();

router.post('/test-notification', async (req, res) => {
  const { fcmToken } = req.body;

  try {
    const response = await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Test Notification',
        body: 'This is a test push from SharpLook backend 🚀',
      },
    });
    res.json({ success: true, response });
  } catch (error: any) {
    console.error("FCM Error:", error);
    res.json({ success: false, error: error.message });
  }
});

export default router;
