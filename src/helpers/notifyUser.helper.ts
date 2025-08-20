import prisma from "../config/prisma";
import { pushNotificationService } from "../services/pushNotifications.service";

export const notifyUser = async (userId: string, title: string, message: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (user?.fcmToken) {
      await pushNotificationService.sendPushNotification(user.fcmToken, title, message);
    } else {
      console.log(`No FCM token found for user ${userId}, skipping push notification.`);
    }
  } catch (error) {
    console.error(`Failed to send push notification to user ${userId}:`, error);
  }
};


// export const notifyUser = async (userId: string, title: string, message: string) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { fcmToken: true },
//     });

//     if (!user?.fcmToken) {
//       console.log(`No FCM token found for user ${userId}, skipping push notification.`);
//       return false;
//     }

//     const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json',
//         'Accept-encoding': 'gzip, deflate',
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         to: user.fcmToken,
//         title,
//         body: message,
//         data: { userId },
//       }),
//     });

//     const result = await expoResponse.json();

//     if (result.data?.[0]?.status === 'error') {
//       console.error(`Expo push error for user ${userId}:`, result.data[0]);
//       return false;
//     }

//     console.log(`Push notification sent to user ${userId}:`, result);
//     return true;
//   } catch (error) {
//     console.error(`Failed to send push notification to user ${userId}:`, error);
//     return false;
//   }
// };