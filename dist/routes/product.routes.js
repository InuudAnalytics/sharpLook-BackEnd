"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/vendor/addProducts", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), upload.single("picture"), product_controller_1.addProduct);
router.get("/getVendorProducts", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), product_controller_1.fetchVendorProducts);
router.get("/getAllProducts", product_controller_1.fetchAllProducts);
router.get("/getAllProductsRatings", product_controller_1.getAllProductsRatings);
router.put("/edit/:productId", auth_middleware_1.verifyToken, upload.single("picture"), (0, auth_middleware_1.requireRole)(["VENDOR"]), product_controller_1.editProduct);
router.delete("/delete/:productId", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), product_controller_1.removeProduct);
// getAllProductsRatings
exports.default = router;
