import { Request, Response, NextFunction } from "express";
import { getUserNotifications, deleteNotification, createNotification } from "../services/notification.service";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { success } from "zod";





// test with postman
import admin from "firebase-admin";

export const sendChatNotification = async (req: Request, res: Response) => {
  try {
    const { token, title, body, roomId } = req.body;

    const message = {
      token,
      data: {
        type: "CHAT_MESSAGE",
        roomId,
      },
      notification: {
        title,
        body,
      },
    };

    const response = await admin.messaging().send(message);

    res.status(200).json({
      success: true,
      message: "Notification sent successfully!",
      response,
    });
  } catch (error: any) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// stop test




export const sendTestNotification = async (req: Request, res: Response) => {
  try {
    const { userId, message, type } = req.body;
    const notification = await createNotification(userId, message, type);

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: notification
    })
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message})
  }
}

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await getUserNotifications(userId);

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const deleteNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.params;

    await deleteNotification(notificationId);

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or already deleted',
      });
    }

    next(error); // let other errors bubble up
  }
};
