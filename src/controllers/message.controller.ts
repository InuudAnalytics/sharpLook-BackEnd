// src/controllers/message.controller.ts
import { Request, Response } from "express"
import {
  getMessagesByRoomId,
  markMessagesAsRead,
  toggleMessageLike,
  countUnreadMessages,
  // getChatListForUser,
  // getChatPreviews,
  getClientChatList,
  getVendorChatList,
  getClientChatPreviews,
  getVendorChatPreviews,
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


export const getClientChatListController = async (req: Request, res: Response) => {
  try {
    const userId  = req.user!.id;

    const chats = await getClientChatList(userId);
    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    console.error('Error fetching client chat list:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch client chat list' });
  }
};



export const getVendorChatListController = async (req: Request, res: Response) => {
  try {
    const userId  = req.user!.id;

    const chats = await getVendorChatList(userId);
    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    console.error('Error fetching vendor chat list:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch vendor chat list' });
  }
};


export const getClientChatPreviewsController = async (req: Request, res: Response) => {
  try {
    const  userId  = req.user!.id;
    const previews = await getClientChatPreviews(userId);
    return res.status(200).json({ success: true, data: previews });
  } catch (error) {
    console.error('Error fetching client chat previews:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch client chat previews' });
  }
};



export const getVendorChatPreviewsController = async (req: Request, res: Response) => {
  try {
    const  userId  = req.user!.id;
    const previews = await getVendorChatPreviews(userId);
    return res.status(200).json({ success: true, data: previews });
  } catch (error) {
    console.error('Error fetching vendor chat previews:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch vendor chat previews' });
  }
};


// export const getChatList = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     const chats = await getChatListForUser(userId);
//     return res.status(200).json({ success: true, data: chats });
//   } catch (error) {
//     return res.status(500).json({ success: false, error: "Failed to fetch chat list" });
//   }
// };

// 7. Get last message preview per room


// export const getChatPreviewsController = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     const previews = await getChatPreviews(userId);
//     return res.status(200).json({ success: true, data: previews });
//   } catch (error) {
//     return res.status(500).json({ success: false, error: "Failed to fetch previews" });
//   }
// };

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
