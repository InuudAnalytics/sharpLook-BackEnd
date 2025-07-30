import express from "express";
import { raiseDispute, getDisputes, resolveDispute } from "../controllers/dispute.controller";
import { verifyToken, requireRole } from "../middlewares/auth.middleware"; // adjust as needed
import { uploadReferencePhoto, uploadSingle } from "../middlewares/upload.middleware";

const router = express.Router();

// 🔒 Auth required
router.post("/raiseDispute", verifyToken, uploadReferencePhoto, raiseDispute);

// 🔒 Admin only
router.get("/getAllDisputes", verifyToken, requireRole(["ADMIN", "SUPERADMIN"]), getDisputes);
router.patch("/resolveDispute", verifyToken, requireRole(["ADMIN", "SUPERADMIN"]), resolveDispute);

export default router;
