"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.editMessageController = exports.deleteMessageController = exports.getChatPreviewsController = exports.getChatList = exports.getVendorChatPreviewsController = exports.getClientChatPreviewsController = exports.getVendorChatListController = exports.getClientChatListController = exports.getUnreadMessageCount = exports.likeMessage = exports.markAsRead = exports.fetchMessages = exports.sendMessageController = void 0;
const message_service_1 = require("../services/message.service");
// import { NotificationService } from "../services/NotificationService";
const notifictionService = __importStar(require("../services/notification.service"));
// save message
const sendMessageController = async (req, res) => {
    try {
        const senderId = req.user?.id; // Must come from JWT middleware
        const { receiverId, roomId, message } = req.body;
        if (!senderId) {
            return res.status(400).json({
                success: false,
                message: "Sender ID missing or not authenticated",
            });
        }
        // save message to database
        // const savedMessage = await saveMessage(senderId, receiverId, roomId, message);
        const newMessage = await (0, message_service_1.saveMessage)(senderId, receiverId, roomId, message);
        // send push notification to receiver
        // await pushNotificationService.sendPushNotification(
        await notifictionService.createNotification(receiverId, "new Message", message);
        return res.status(200).json({
            sucess: true,
            message: "Message sent successfully",
            data: newMessage,
            // data: message
        });
    }
    catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({
            sucess: false,
            message: error.message || "Failed to send message",
        });
    }
};
exports.sendMessageController = sendMessageController;
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
        const userId = req.user.id;
        console.log('tHIS IS USER ID OOO:::', userId);
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
        const userId = req.user.id;
        const chats = await (0, message_service_1.getVendorChatList)(userId);
        return res.status(200).json({ success: true, data: chats });
    }
    catch (error) {
        console.error('Error fetching vendor chat list:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch vendor chat list' });
    }
};
exports.getVendorChatListController = getVendorChatListController;
const getClientChatPreviewsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const previews = await (0, message_service_1.getClientChatPreviews)(userId);
        return res.status(200).json({ success: true, data: previews });
    }
    catch (error) {
        console.error('Error fetching client chat previews:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch client chat previews' });
    }
};
exports.getClientChatPreviewsController = getClientChatPreviewsController;
const getVendorChatPreviewsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const previews = await (0, message_service_1.getVendorChatPreviews)(userId);
        return res.status(200).json({ success: true, data: previews });
    }
    catch (error) {
        console.error('Error fetching vendor chat previews:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch vendor chat previews' });
    }
};
exports.getVendorChatPreviewsController = getVendorChatPreviewsController;
const getChatList = async (req, res) => {
    try {
        const { userId } = req.params;
        const chats = await (0, message_service_1.getChatListForUser)(userId);
        return res.status(200).json({ success: true, data: chats });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "Failed to fetch chat list" });
    }
};
exports.getChatList = getChatList;
// 7. Get last message preview per room
const getChatPreviewsController = async (req, res) => {
    try {
        const { userId } = req.params;
        const previews = await (0, message_service_1.getChatPreviews)(userId);
        return res.status(200).json({ success: true, data: previews });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "Failed to fetch previews" });
    }
};
exports.getChatPreviewsController = getChatPreviewsController;
// 8. Delete a message/
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
