"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editMessageController = exports.deleteMessageController = exports.getVendorChatListController = exports.getClientChatListController = exports.getUnreadMessageCount = exports.likeMessage = exports.markAsRead = exports.fetchMessages = void 0;
const message_service_1 = require("../services/message.service");
const fetchMessages = async (req, res) => {
    const { roomId } = req.params;
    try {
        const messages = await (0, message_service_1.getMessagesByRoomId)(roomId);
        return res.status(200).json({
            success: true,
            message: "Messages fetched successfully",
            data: messages
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.fetchMessages = fetchMessages;
const markAsRead = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user?.id;
    try {
        await (0, message_service_1.markMessagesAsRead)(roomId, userId);
        return res.status(200).json({
            success: true,
            message: "Messages marked as read"
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.markAsRead = markAsRead;
const likeMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user?.id;
    try {
        const message = await (0, message_service_1.toggleMessageLike)(messageId, userId);
        return res.status(200).json({
            success: true,
            message: "Message like toggled",
            data: message
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.likeMessage = likeMessage;
const getUnreadMessageCount = async (req, res) => {
    try {
        const count = await (0, message_service_1.countUnreadMessages)(req.user.id);
        return res.status(200).json({
            success: true,
            message: "Unread message count fetched",
            data: count
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getUnreadMessageCount = getUnreadMessageCount;
const getClientChatListController = async (req, res) => {
    try {
        const { userId } = req.params;
        const chats = await (0, message_service_1.getClientChatList)(userId);
        return res.status(200).json({ success: true, data: chats });
    }
    catch (error) {
        console.error('Error fetching client chat list:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch client chat list' });
    }
};
exports.getClientChatListController = getClientChatListController;
const getVendorChatListController = async (req, res) => {
    try {
        const { userId } = req.params;
        const chats = await (0, message_service_1.getVendorChatList)(userId);
        return res.status(200).json({ success: true, data: chats });
    }
    catch (error) {
        console.error('Error fetching vendor chat list:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch vendor chat list' });
    }
};
exports.getVendorChatListController = getVendorChatListController;
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
const deleteMessageController = async (req, res) => {
    try {
        const { messageId } = req.params;
        await (0, message_service_1.deleteMessage)(messageId);
        return res.status(200).json({ success: true, message: "Message deleted" });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "Failed to delete message" });
    }
};
exports.deleteMessageController = deleteMessageController;
// 9. Edit a message
const editMessageController = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { newText } = req.body;
        const updated = await (0, message_service_1.editMessage)(messageId, newText);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "Failed to edit message" });
    }
};
exports.editMessageController = editMessageController;
