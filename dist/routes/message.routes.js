"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/message.routes.ts
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const message_controller_1 = require("../controllers/message.controller");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, "../../uploads");
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        const baseName = path_1.default.basename(file.originalname, ext);
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});
// File filter for security
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
        // Images
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        // Audio
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/m4a",
        "audio/aac",
        "audio/ogg",
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        // Video (optional)
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only images, audio, and documents are allowed.`), false);
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter,
});
// Message routes
router.post("/send", auth_middleware_1.verifyToken, message_controller_1.sendMessageController);
router.post("/upload", auth_middleware_1.verifyToken, upload.single("file"), message_controller_1.uploadMediaController);
router.get("/:roomId", auth_middleware_1.verifyToken, message_controller_1.fetchMessages);
router.patch("/:roomId/read", auth_middleware_1.verifyToken, message_controller_1.markAsRead);
router.patch("/:messageId/like", auth_middleware_1.verifyToken, message_controller_1.likeMessage);
router.get("/unread/count", auth_middleware_1.verifyToken, message_controller_1.getUnreadMessageCount);
// Chat list routes
router.get("/user/getClientChatsList", auth_middleware_1.verifyToken, message_controller_1.getClientChatListController);
router.get("/user/getVendorChats", auth_middleware_1.verifyToken, message_controller_1.getVendorChatListController);
router.get("/client/previews", auth_middleware_1.verifyToken, message_controller_1.getClientChatPreviewsController);
router.get("/vendor/previews", auth_middleware_1.verifyToken, message_controller_1.getVendorChatPreviewsController);
// Message actions
router.delete("/:messageId", auth_middleware_1.verifyToken, message_controller_1.deleteMessageController);
router.patch("/edit/:messageId", auth_middleware_1.verifyToken, message_controller_1.editMessageController);
exports.default = router;
