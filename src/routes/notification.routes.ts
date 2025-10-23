import express from "express"
import { getNotifications, deleteNotificationController, sendTestNotification, sendChatNotification } from "../controllers/notification.controller"
import { verifyToken } from "../middlewares/auth.middleware"

const router = express.Router()

// test with postman
router.post("/chat", sendChatNotification);

router.post("/sendNotification", sendTestNotification)
router.get("/getNotifications", verifyToken, getNotifications)
router.delete("/delete/:notificationId", verifyToken, deleteNotificationController);

export default router
