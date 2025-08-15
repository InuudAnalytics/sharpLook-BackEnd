"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/message.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const message_controller_1 = require("../controllers/message.controller");
const router = (0, express_1.Router)();
router.get("/:roomId", auth_middleware_1.verifyToken, message_controller_1.fetchMessages);
router.patch("/:roomId/read", auth_middleware_1.verifyToken, message_controller_1.markAsRead);
router.patch("/:messageId/like", auth_middleware_1.verifyToken, message_controller_1.likeMessage);
router.get("/unread/count", auth_middleware_1.verifyToken, message_controller_1.getUnreadMessageCount);
// router.get("/chats/:userId", getChatList); // list of rooms/chats
// router.get("/previews/:userId", getChatPreviewsController); // last messages in rooms
router.get("/user/getClientChatsList", auth_middleware_1.verifyToken, message_controller_1.getClientChatListController);
router.get("/user/getVendorChats", auth_middleware_1.verifyToken, message_controller_1.getVendorChatListController);
router.get('/client/previews', auth_middleware_1.verifyToken, message_controller_1.getClientChatPreviewsController);
router.get('/vendor/previews', auth_middleware_1.verifyToken, message_controller_1.getVendorChatPreviewsController);
router.delete("/:messageId", message_controller_1.deleteMessageController); // delete a message
router.patch("/edit/:messageId", message_controller_1.editMessageController); // edit a message
exports.default = router;
