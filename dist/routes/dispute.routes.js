"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dispute_controller_1 = require("../controllers/dispute.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // adjust as needed
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = express_1.default.Router();
// 🔒 Auth required
router.post("/raiseDispute", auth_middleware_1.verifyToken, upload_middleware_1.uploadReferencePhoto, dispute_controller_1.raiseDispute);
// 🔒 Admin only
router.get("/getAllDisputes", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["ADMIN", "SUPERADMIN"]), dispute_controller_1.getDisputes);
router.patch("/resolveDispute", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["ADMIN", "SUPERADMIN"]), dispute_controller_1.resolveDispute);
// 📌 POST: Create a new vendor order dispute (with image upload)
router.post("/createOrderdispute", auth_middleware_1.verifyToken, upload_middleware_1.uploadDisputeImage, dispute_controller_1.createVendorOrderDisputeHandler);
// 📌 GET: Fetch all vendor order disputes
router.get("/getOrderDisputes", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["ADMIN", "SUPERADMIN"]), dispute_controller_1.getAllVendorOrderDisputesHandler);
// 📌 PATCH: Update dispute status (RESOLVED or REJECTED)
router.patch("/updateDispute", auth_middleware_1.verifyToken, (0, auth_middleware_1.requireRole)(["ADMIN", "SUPERADMIN"]), dispute_controller_1.updateVendorOrderDisputeStatusHandler);
exports.default = router;
