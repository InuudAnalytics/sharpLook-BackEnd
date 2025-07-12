"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get("/me", auth_middleware_1.verifyToken, user_controller_1.getMyProfile);
router.put("/me", auth_middleware_1.verifyToken, user_controller_1.updateMyProfile);
exports.default = router;
