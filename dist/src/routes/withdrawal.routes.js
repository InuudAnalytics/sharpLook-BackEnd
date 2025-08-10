"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const withdrawal_controller_1 = require("../controllers/withdrawal.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const admin_middleware_1 = require("../middlewares/admin.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.post("/requestWithdrawals", auth_middleware_1.verifyToken, withdrawal_controller_1.requestWithdrawal);
router.post("/verifyAcct", auth_middleware_1.verifyToken, withdrawal_controller_1.resolveAccountController);
router.get("/myWithdrawals", auth_middleware_1.verifyToken, withdrawal_controller_1.getUserWithdrawals);
// ADMIN: View all withdrawals
router.get("/all", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), withdrawal_controller_1.getAllWithdrawals);
// ADMIN: Update withdrawal status
router.patch("/:id/status", (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), withdrawal_controller_1.updateWithdrawalStatus);
exports.default = router;
router.get("/getBanksList", auth_middleware_1.verifyToken, withdrawal_controller_1.getAllBanks);
