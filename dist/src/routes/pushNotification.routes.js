"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/pushNotification.routes.ts
const express_1 = require("express");
const pushNotification_controller_1 = require("../controllers/pushNotification.controller");
const router = (0, express_1.Router)();
router.post('/pushNotifications', (req, res) => pushNotification_controller_1.pushNotificationController.sendTestPush(req, res));
exports.default = router;
