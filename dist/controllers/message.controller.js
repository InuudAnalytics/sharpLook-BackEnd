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
exports.editMessageController = exports.deleteMessageController = exports.getChatPreviewsController = exports.getChatList = exports.getVendorChatPreviewsController = exports.getClientChatPreviewsController = exports.getVendorChatListController = exports.getClientChatListController = exports.getUnreadMessageCount = exports.likeMessage = exports.markAsRead = exports.fetchMessages = exports.uploadMediaController = exports.sendMessageController = void 0;
const message_service_1 = require("../services/message.service");
const notificationService = __importStar(require("../services/notification.service"));
// Send message (text or media)
const sendMessageController = async (req, res) => {
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
        let mediaUrl = undefined;
        if (req.file) {
            // Assuming you're using multer or similar middleware
            // Store the file path or upload to cloud storage
            mediaUrl = req.file.path || req.file.filename;
        }
        const newMessage = await (0, message_service_1.saveMessage)(senderId, receiverId, roomId, message, type || "text", mediaUrl, duration);
        // Update sender's last activity
        await (0, message_service_1.updateUserActivity)(senderId);
        // Send push notification to receiver
        await notificationService.createNotification(receiverId, "New Message", message);
        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage,
        });
    }
    catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send message",
        });
    }
};
exports.sendMessageController = sendMessageController;
// Upload media endpoint
const uploadMediaController = async (req, res) => {
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
        if (type === "image")
            messageText = "📷 Photo";
        if (type === "voice")
            messageText = "🎤 Voice message";
        if (type === "document")
            messageText = `📄 ${req.file.originalname}`;
        const newMessage = await (0, message_service_1.saveMessage)(senderId, receiverId, roomId, messageText, type, mediaUrl, duration);
        return res.status(200).json({
            success: true,
            message: "Media uploaded successfully",
            data: newMessage,
            mediaUrl,
        });
    }
    catch (error) {
        console.error("Error uploading media:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload media",
        });
    }
};
exports.uploadMediaController = uploadMediaController;
// Fetch messages
const fetchMessages = async (req, res) => {
    const { roomId } = req.params;
    try {
        const messages = await (0, message_service_1.getMessagesByRoomId)(roomId);
        // Update user activity
        if (req.user?.id) {
            await (0, message_service_1.updateUserActivity)(req.user.id);
        }
        return res.status(200).json({
            success: true,
            message: "Messages fetched successfully",
            data: messages,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
exports.fetchMessages = fetchMessages;
// Mark messages as read
const markAsRead = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user?.id;
    try {
        await (0, message_service_1.markMessagesAsRead)(roomId, userId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({
            success: true,
            message: "Messages marked as read",
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
exports.markAsRead = markAsRead;
// Like/unlike message
const likeMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user?.id;
    try {
        const message = await (0, message_service_1.toggleMessageLike)(messageId, userId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({
            success: true,
            message: "Message like toggled",
            data: message,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
exports.likeMessage = likeMessage;
// Get unread message count
const getUnreadMessageCount = async (req, res) => {
    try {
        const count = await (0, message_service_1.countUnreadMessages)(req.user.id);
        return res.status(200).json({
            success: true,
            message: "Unread message count fetched",
            data: count,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
exports.getUnreadMessageCount = getUnreadMessageCount;
// Get client chat list
const getClientChatListController = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("Fetching client chat list for user:", userId);
        const chats = await (0, message_service_1.getClientChatList)(userId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({ success: true, data: chats });
    }
    catch (error) {
        console.error("Error fetching client chat list:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch client chat list",
        });
    }
};
exports.getClientChatListController = getClientChatListController;
// Get vendor chat list
const getVendorChatListController = async (req, res) => {
    try {
        const userId = req.user.id;
        const chats = await (0, message_service_1.getVendorChatList)(userId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({ success: true, data: chats });
    }
    catch (error) {
        console.error("Error fetching vendor chat list:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch vendor chat list",
        });
    }
};
exports.getVendorChatListController = getVendorChatListController;
// Get client chat previews
const getClientChatPreviewsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const previews = await (0, message_service_1.getClientChatPreviews)(userId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({ success: true, data: previews });
    }
    catch (error) {
        console.error("Error fetching client chat previews:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch client chat previews",
        });
    }
};
exports.getClientChatPreviewsController = getClientChatPreviewsController;
// Get vendor chat previews
const getVendorChatPreviewsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const previews = await (0, message_service_1.getVendorChatPreviews)(userId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({ success: true, data: previews });
    }
    catch (error) {
        console.error("Error fetching vendor chat previews:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch vendor chat previews",
        });
    }
};
exports.getVendorChatPreviewsController = getVendorChatPreviewsController;
// Get chat list
const getChatList = async (req, res) => {
    try {
        const { userId } = req.params;
        const chats = await (0, message_service_1.getChatListForUser)(userId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({ success: true, data: chats });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, error: "Failed to fetch chat list" });
    }
};
exports.getChatList = getChatList;
// Get chat previews
const getChatPreviewsController = async (req, res) => {
    try {
        const { userId } = req.params;
        const previews = await (0, message_service_1.getChatPreviews)(userId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({ success: true, data: previews });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, error: "Failed to fetch previews" });
    }
};
exports.getChatPreviewsController = getChatPreviewsController;
// Delete message
const deleteMessageController = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        await (0, message_service_1.deleteMessage)(messageId);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res
            .status(200)
            .json({ success: true, message: "Message deleted" });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, error: "Failed to delete message" });
    }
};
exports.deleteMessageController = deleteMessageController;
// Edit message
const editMessageController = async (req, res) => {
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
        const updated = await (0, message_service_1.editMessage)(messageId, newText);
        // Update user activity
        await (0, message_service_1.updateUserActivity)(userId);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, error: "Failed to edit message" });
    }
};
exports.editMessageController = editMessageController;
