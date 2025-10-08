import prisma from "../config/prisma"
import {haversineDistanceKm} from "../utils/distance"
import { pushNotificationService } from "./pushNotifications.service";


// export const createNotification = async (
//   userId: string,
//   message: string,
//   type: string = "BOOKING"
// ) => {
//   return await prisma.notification.create({
//     data: {
//       userId,
//       message,
//       type,
//     },
//   })
// }

export const createNotification = async (
  userId: string,
  message: string,
  type: string = "BOOKING"
) => {
  // 1 Save the notification to the database
  const notification = await prisma.notification.create({
    data: {
      userId,
      message,
      type,
    },
  });

  // 2 Get user's FCM token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true },
  });

  // 3 Send Firebase push notification
  if (user?.fcmToken) {  
    try {
      await pushNotificationService.sendPushNotification(
        user.fcmToken,
        // "dzdhmdA-RzWLTOoO5PN2FO:APA91bFowOjmQuBQUac4CV31u-VYJSLM4hLdyP9XZo94UNL3VVbvLo9dqeCNvF9qlEKD6-01BAISfsb_nsAACLB2eYtUN1mEh3gkuJv0j80TAdGz2npGrxA",    
        // "e_JWXm6Jlks7ooWeg8kmSl:APA91bGxcBQ9guBM1hWYwhvyy9yjVokTpsD-fjMaCSbaxb0LryhrCvBrzrdw6oXc9tJxPF5fZEfX8I95zjc3JLnAfierLO-I2orWhtal6Iy5IMc4DMCGI0Y",
        "New Notification",
        message
      );
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }
  return notification;
};

export const getUserNotifications = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}


export const deleteNotification = async (notificationId: string) => {
  return await prisma.notification.delete({
    where: { id: notificationId },
  });
};

export const notifyNearbyVendors = async (offer: any) => {
  const vendors = await prisma.user.findMany({
    where: {
      role: "VENDOR",
      vendorOnboarding: {
        NOT: {
          latitude: null,
        },
      },
    },
    include: {
      vendorOnboarding: true,
    },
  });

  const filtered = vendors.filter((vendor) => {
    const coords = vendor.vendorOnboarding;
    if (!coords?.latitude || !coords?.longitude) return false;

    const distance = haversineDistanceKm(
      coords.latitude,
      coords.longitude,
      offer.latitude,
      offer.longitude
    );

    return distance <= 10;
  });

  if (filtered.length > 0) {
    const notifications = filtered.map((vendor) => ({
      userId: vendor.id,
      type: "NEW_OFFER",
      message: `New service offer near you: ${offer.serviceName}`,
      metadata: { offerId: offer.id },
    }));

    await prisma.notification.createMany({
      data: notifications,
    });
  } else {
    console.log("No nearby vendors found for offer:", offer.id);

    // Notify the user who created the offer
    await prisma.notification.create({
      data: {
        userId: offer.clientId, // Make sure `offer.clientId` exists
        type: "NO_VENDOR_FOUND",
        message: `No nearby vendors were found for your service offer: ${offer.serviceName}`,
      },
    });
  }
};


