"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const vendorService_controller_1 = require("../controllers/vendorService.controller");
const router = express_1.default.Router();
router.post("/addService", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), upload_middleware_1.uploadSingle2, vendorService_controller_1.createVendorService);
router.get("/my-services", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), vendorService_controller_1.fetchVendorServices);
router.get("/allServices", vendorService_controller_1.fetchAllVendorServices);
router.put("/edit/:serviceId", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), upload_middleware_1.uploadSingle2, vendorService_controller_1.updateVendorService);
router.delete("/delete/:serviceId", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["VENDOR"]), vendorService_controller_1.deleteAVendorService);
exports.default = router;
