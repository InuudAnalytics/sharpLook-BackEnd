"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wallet_controller_1 = require("../controllers/wallet.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get("/walletDetails", auth_middleware_1.verifyToken, wallet_controller_1.getWalletDetails);
router.get("/transactions", auth_middleware_1.verifyToken, wallet_controller_1.walletTransactions);
exports.default = router;
