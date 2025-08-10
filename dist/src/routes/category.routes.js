"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const admin_middleware_1 = require("../middlewares/admin.middleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.post("/addAService", auth_middleware_1.verifyToken, (0, admin_middleware_1.requireAdminRole)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), category_controller_1.handleCreateServiceCategory);
router.get("/getAllServices", auth_middleware_1.verifyToken, category_controller_1.handleGetServiceCategories);
exports.default = router;
