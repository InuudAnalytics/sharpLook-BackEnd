// src/services/pushNotification.service.ts
// import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import { Message } from 'firebase-admin/messaging';

import admin from '../utils/firebase';

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


export class PushNotificationService {
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<string | null> {
    const message: Message = {
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
      const response = await admin.messaging().send(message);
      console.log("Push notification sent:", response);
      return response;
    } catch (error: any) {
      console.error("Error sending push notification:", error.message || error);
      return null;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
