// src/controllers/message.controller.ts
import { Request, Response } from "express";
import {
  saveMessage,
  getMessagesByRoomId,
  markMessagesAsRead,
  toggleMessageLike,
  countUnreadMessages,
  getChatListForUser,
  getChatPreviews,
  getClientChatList,
  getVendorChatList,
  getClientChatPreviews,
  getVendorChatPreviews,
  deleteMessage,
  editMessage,
  updateUserActivity,
} from "../services/message.service";
import { pushNotificationService } from "../services/pushNotifications.service";
import * as notificationService from "../services/notification.service";

// Send message (text or media)
export const sendMessageController = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, roomId, message, type, duration } = req.body;

    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: "Sender ID missing or not authenticated",
      });
    }

    // Handle file upload if present
    let mediaUrl: string | undefined = undefined;
    if (req.file) {
      // Assuming you're using multer or similar middleware
      // Store the file path or upload to cloud storage
      mediaUrl = req.file.path || req.file.filename;
    }

    const newMessage = await saveMessage(
      senderId,
      receiverId,
      roomId,
      message,
      type || "text",
      mediaUrl,
      duration
    );

    // Update sender's last activity
    await updateUserActivity(senderId);

    // Send push notification to receiver
    await notificationService.createNotification(
      receiverId,
      "New Message",
      message
    );

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

// Upload media endpoint
export const uploadMediaController = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, roomId, type, duration } = req.body;

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get file URL (adjust based on your storage solution)
    const mediaUrl = req.file.path || `/uploads/${req.file.filename}`;

    // Create message text based on type
    let messageText = "Media file";
    if (type === "image") messageText = "📷 Photo";
    if (type === "voice") messageText = "🎤 Voice message";
    if (type === "document") messageText = `📄 ${req.file.originalname}`;

    const newMessage = await saveMessage(
      senderId,
      receiverId,
      roomId,
      messageText,
      type,
      mediaUrl,
      duration
    );

    return res.status(200).json({
      success: true,
      message: "Media uploaded successfully",
      data: newMessage,
      mediaUrl,
    });
  } catch (error: any) {
    console.error("Error uploading media:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload media",
    });
  }
};

// Fetch messages
export const fetchMessages = async (req: Request, res: Response) => {
  const { roomId } = req.params;

  try {
    const messages = await getMessagesByRoomId(roomId);
    
    // Update user activity
    if (req.user?.id) {
      await updateUserActivity(req.user.id);
    }

    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Mark messages as read
export const markAsRead = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user?.id!;

  try {
    await markMessagesAsRead(roomId, userId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Like/unlike message
export const likeMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user?.id!;

  try {
    const message = await toggleMessageLike(messageId, userId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({
      success: true,
      message: "Message like toggled",
      data: message,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get unread message count
export const getUnreadMessageCount = async (req: Request, res: Response) => {
  try {
    const count = await countUnreadMessages(req.user!.id);
    return res.status(200).json({
      success: true,
      message: "Unread message count fetched",
      data: count,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get client chat list
export const getClientChatListController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    console.log("Fetching client chat list for user:", userId);

    const chats = await getClientChatList(userId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    console.error("Error fetching client chat list:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch client chat list",
    });
  }
};

// Get vendor chat list
export const getVendorChatListController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const chats = await getVendorChatList(userId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    console.error("Error fetching vendor chat list:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch vendor chat list",
    });
  }
};

// Get client chat previews
export const getClientChatPreviewsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const previews = await getClientChatPreviews(userId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({ success: true, data: previews });
  } catch (error) {
    console.error("Error fetching client chat previews:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch client chat previews",
    });
  }
};

// Get vendor chat previews
export const getVendorChatPreviewsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const previews = await getVendorChatPreviews(userId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({ success: true, data: previews });
  } catch (error) {
    console.error("Error fetching vendor chat previews:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch vendor chat previews",
    });
  }
};

// Get chat list
export const getChatList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const chats = await getChatListForUser(userId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch chat list" });
  }
};

// Get chat previews
export const getChatPreviewsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const previews = await getChatPreviews(userId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({ success: true, data: previews });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch previews" });
  }
};

// Delete message
export const deleteMessageController = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    await deleteMessage(messageId);
    
    // Update user activity
    await updateUserActivity(userId);

    return res
      .status(200)
      .json({ success: true, message: "Message deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete message" });
  }
};

// Edit message
export const editMessageController = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { newText } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const updated = await editMessage(messageId, newText);
    
    // Update user activity
    await updateUserActivity(userId);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to edit message" });
  }
};