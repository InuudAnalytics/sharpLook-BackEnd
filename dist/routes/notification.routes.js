"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post("/sendNotification", notification_controller_1.sendTestNotification);
router.get("/getNotifications", auth_middleware_1.verifyToken, notification_controller_1.getNotifications);
router.delete("/delete/:notificationId", auth_middleware_1.verifyToken, notification_controller_1.deleteNotificationController);
exports.default = router;
