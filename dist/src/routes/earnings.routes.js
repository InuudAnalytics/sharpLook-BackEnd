"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const earnings_controller_1 = require("../controllers/earnings.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get("/getVendorEarnings", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), earnings_controller_1.getVendorEarnings);
exports.default = router;
