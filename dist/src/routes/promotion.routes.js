"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/promotion.routes.ts
const express_1 = require("express");
const promotion_controller_1 = require("../controllers/promotion.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Vendor only
router.post("/createPromotion", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), promotion_controller_1.createPromotion);
router.get("/getMyPromotions", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), promotion_controller_1.getMyPromotions);
router.patch("/:promotionId/status", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), promotion_controller_1.changePromotionStatus);
// Public
router.get("/active", promotion_controller_1.getAllActivePromotions);
exports.default = router;
