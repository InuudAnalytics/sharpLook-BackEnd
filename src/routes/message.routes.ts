// src/routes/message.routes.ts
import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware"
import {
  fetchMessages,
  markAsRead,
  likeMessage,
  getUnreadMessageCount,
  //   getChatList,
  // getChatPreviewsController,

  getClientChatListController,
  getVendorChatListController,
  getClientChatPreviewsController,
  getVendorChatPreviewsController,
  deleteMessageController,
  editMessageController,
  
} from "../controllers/message.controller"
import { objectEnumValues } from "@prisma/client/runtime/library"

const router = Router()

router.get("/:roomId", verifyToken, fetchMessages)
router.patch("/:roomId/read", verifyToken, markAsRead)
router.patch("/:messageId/like", verifyToken, likeMessage)
router.get("/unread/count", verifyToken, getUnreadMessageCount)


// router.get("/chats/:userId", getChatList); // list of rooms/chats
// router.get("/previews/:userId", getChatPreviewsController); // last messages in rooms


router.get("/user/getClientChatsList", verifyToken, getClientChatListController)
router.get("/user/getVendorChats", verifyToken, getVendorChatListController)
router.get('/client/previews', verifyToken, getClientChatPreviewsController);
router.get('/vendor/previews', verifyToken, getVendorChatPreviewsController);

router.delete("/:messageId", deleteMessageController); // delete a message
router.patch("/edit/:messageId", editMessageController); // edit a message

export default router
