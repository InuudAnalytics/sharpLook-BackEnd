// src/controllers/message.controller.ts
import { Request, Response } from "express"
import {
  getMessagesByRoomId,
  markMessagesAsRead,
  toggleMessageLike,
  countUnreadMessages,
  getChatListForUser,
  getChatPreviews,
  deleteMessage,
  editMessage,
} from "../services/message.service"

export const fetchMessages = async (req: Request, res: Response) => {
  const { roomId } = req.params;

  try {
    const messages = await getMessagesByRoomId(roomId);
    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: messages
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const markAsRead = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user?.id!;

  try {
    await markMessagesAsRead(roomId, userId);
    return res.status(200).json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const likeMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user?.id!;

  try {
    const message = await toggleMessageLike(messageId, userId);
    return res.status(200).json({
      success: true,
      message: "Message like toggled",
      data: message
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



export const getUnreadMessageCount = async (req: Request, res: Response) => {
  try {
    const count = await countUnreadMessages(req.user!.id);
    return res.status(200).json({
      success: true,
      message: "Unread message count fetched",
      data: count
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const getChatList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const chats = await getChatListForUser(userId);
    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch chat list" });
  }
};

// 7. Get last message preview per room
export const getChatPreviewsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const previews = await getChatPreviews(userId);
    return res.status(200).json({ success: true, data: previews });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch previews" });
  }
};

// 8. Delete a message
export const deleteMessageController = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    await deleteMessage(messageId);
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to delete message" });
  }
};

// 9. Edit a message
export const editMessageController = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { newText } = req.body;
    const updated = await editMessage(messageId, newText);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to edit message" });
  }
};
