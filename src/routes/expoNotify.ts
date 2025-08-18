// routes/notifications.routes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

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
  } catch (error) {
    console.error('Error updating token:', error);
    res.status(500).json({ error: 'Failed to update token' });
  }
});

router.use(verifyToken)

// ✅ Send notification
router.post( '/send', async (req, res) => {
    const userId = req.user!.id
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
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Notification failed' });
  }
});

export default router;
