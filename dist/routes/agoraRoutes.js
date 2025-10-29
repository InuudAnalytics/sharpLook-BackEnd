"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agoraController_1 = require("../controllers/agoraController");
const router = (0, express_1.Router)();
router.post('/generate-token', agoraController_1.generateToken);
router.post('/renew-token', agoraController_1.renewToken);
exports.default = router;
