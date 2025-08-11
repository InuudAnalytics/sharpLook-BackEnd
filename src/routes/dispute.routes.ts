import express from "express";
import { raiseDispute, getDisputes, resolveDispute, createVendorOrderDisputeHandler, getAllVendorOrderDisputesHandler, updateVendorOrderDisputeStatusHandler } from "../controllers/dispute.controller";
import { verifyToken, requireRole } from "../middlewares/auth.middleware"; // adjust as needed
import { uploadDisputeImage, uploadReferencePhoto, uploadSingle } from "../middlewares/upload.middleware";

const router = express.Router();

// 🔒 Auth required
router.post("/raiseDispute", verifyToken, uploadReferencePhoto, raiseDispute);

// 🔒 Admin only
router.get("/getAllDisputes", verifyToken, requireRole(["ADMIN", "SUPERADMIN"]), getDisputes);
router.patch("/resolveDispute", verifyToken, requireRole(["ADMIN", "SUPERADMIN"]), resolveDispute);


// 📌 POST: Create a new vendor order dispute (with image upload)
router.post("/createOrderdispute22", verifyToken,
uploadDisputeImage,
  createVendorOrderDisputeHandler
);

// 📌 GET: Fetch all vendor order disputes
router.get("/getOrderDisputes", verifyToken, requireRole(["ADMIN", "SUPERADMIN"]), getAllVendorOrderDisputesHandler);

// 📌 PATCH: Update dispute status (RESOLVED or REJECTED)
router.patch(
  "/updateDispute",verifyToken, requireRole(["ADMIN", "SUPERADMIN"]),
  updateVendorOrderDisputeStatusHandler
);

export default router;
