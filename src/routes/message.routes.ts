// src/routes/message.routes.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  sendMessageController,
  fetchMessages,
  markAsRead,
  likeMessage,
  getUnreadMessageCount,
  getClientChatListController,
  getVendorChatListController,
  getClientChatPreviewsController,
  getVendorChatPreviewsController,
  deleteMessageController,
  editMessageController,
  uploadMediaController,
} from "../controllers/message.controller";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for security
const fileFilter = (req: any, file: any, cb: any) => {
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
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only images, audio, and documents are allowed.`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Message routes
router.post("/send", verifyToken, sendMessageController);
router.post("/upload", verifyToken, upload.single("file"), uploadMediaController);
router.get("/:roomId", verifyToken, fetchMessages);
router.patch("/:roomId/read", verifyToken, markAsRead);
router.patch("/:messageId/like", verifyToken, likeMessage);
router.get("/unread/count", verifyToken, getUnreadMessageCount);

// Chat list routes
router.get("/user/getClientChatsList", verifyToken, getClientChatListController);
router.get("/user/getVendorChats", verifyToken, getVendorChatListController);
router.get("/client/previews", verifyToken, getClientChatPreviewsController);
router.get("/vendor/previews", verifyToken, getVendorChatPreviewsController);

// Message actions
router.delete("/:messageId", verifyToken, deleteMessageController);
router.patch("/edit/:messageId", verifyToken, editMessageController);

export default router;