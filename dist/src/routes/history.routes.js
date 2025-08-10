"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const history_controller_1 = require("../controllers/history.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get("/past", auth_middleware_1.verifyToken, history_controller_1.fetchPastHistory);
router.get("/upcoming", auth_middleware_1.verifyToken, history_controller_1.fetchUpcomingHistory);
exports.default = router;
