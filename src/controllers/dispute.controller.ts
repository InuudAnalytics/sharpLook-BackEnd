import { Request, Response } from "express";
import * as DisputeService from "../services/dispute.service";
import { uploadDisputeImage } from "../middlewares/upload.middleware";
import uploadBufferToCloudinary from "../utils/cloudinary";
import {
  createVendorOrderDispute,
  getAllVendorOrderDisputes,
  updateVendorOrderDisputeStatus,
} from "../services/dispute.service";


export const raiseDispute = [

  async (req: Request, res: Response) => {
    const { bookingId, reason } = req.body;
    const userId = req.user?.id!;
    const raisedById = userId
    try {
      let imageUrl: string | undefined;
      if (req.file) {
        const result = await uploadBufferToCloudinary(req.file.buffer, "hairdesign/vendors");
        imageUrl = result.secure_url;
      }

      const dispute = await DisputeService.createDispute(
        bookingId,
        raisedById,
        reason,
        imageUrl
      );

      res.status(201).json({ success: true, message: "Dispute submitted", dispute });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Dispute creation failed" });
    }
  }
];

export const getDisputes = async (_req: Request, res: Response) => {
  try {
    const disputes = await DisputeService.getAllDisputes();
    res.json({ success: true, disputes });
  } catch (error) {
    console.error("Failed to get disputes:", error);
    res.status(500).json({ success: false, message: "Failed to fetch disputes" });
  }
};

export const resolveDispute = async (req: Request, res: Response) => {

  const { status, resolution, id } = req.body;

  if (!["RESOLVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const updated = await DisputeService.updateDisputeStatus(id, status as any, resolution);
    res.json({ success: true, message: `Dispute ${status.toLowerCase()}`, dispute: updated });
  } catch (error) {
    console.error("Failed to update dispute:", error);
    res.status(500).json({ success: false, message: "Failed to update dispute" });
  }
};



export const createVendorOrderDisputeHandler = async (req: Request, res: Response) => {
  try {
    console.log("🔥 createVendorOrderDisputeHandler triggered");

    const userId = req.user!.id;

    const { reason, vendorOrderIds } = req.body;

    console.log("📦 req.body:", JSON.stringify(req.body, null, 2));
    console.log("📨 vendorOrderIds (raw):", vendorOrderIds);
    console.log("📨 Type of vendorOrderIds:", typeof vendorOrderIds);

    if (!reason || !vendorOrderIds) {
      return res.status(400).json({ error: "Missing reason or vendorOrderIds" });
    }

    let parsedVendorOrderIds: string[];

    try {
      // Handle form-data: vendorOrderIds is a string like '["id1","id2"]'
      parsedVendorOrderIds =
        typeof vendorOrderIds === "string"
          ? JSON.parse(vendorOrderIds)
          : vendorOrderIds;
    } catch (err) {
      console.error("❌ Failed to parse vendorOrderIds:", err);
      return res.status(400).json({ error: "vendorOrderIds must be a valid JSON array" });
    }

    if (!Array.isArray(parsedVendorOrderIds) || parsedVendorOrderIds.length === 0) {
      console.error("❌ Invalid parsedVendorOrderIds:", parsedVendorOrderIds);
      return res.status(400).json({ error: "vendorOrderIds must be a non-empty item Array" });
    }

    let disputeImage: string | undefined;
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer, "hairdesign/vendors");
      disputeImage = result.secure_url;
    }

    const disputes = await createVendorOrderDispute(
      parsedVendorOrderIds,
      userId,
      reason,
      disputeImage
    );

    return res.status(201).json({
      success: true,
      message: "Dispute(s) created successfully",
      data: disputes,
    });
  } catch (err: any) {
    console.error("❌ Dispute creation error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
;


export const getAllVendorOrderDisputesHandler = async (req: Request, res: Response) => {
  try {
    const disputes = await getAllVendorOrderDisputes();
    return res.status(200).json(disputes);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch disputes" , message: err});
  }
};



export const updateVendorOrderDisputeStatusHandler = async (req: Request, res: Response) => {
  try {
    const { status, disputeId } = req.body;
    const resolution = "REFUND_TO_CLIENT"
    // ✅ Validate input
    if (!disputeId || !status) {
      return res.status(400).json({ error: "disputeId and status are required" });
    }

    if (!["RESOLVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Invalid dispute status" });
    }

    const updatedDispute = await updateVendorOrderDisputeStatus(
      disputeId,
      status as "RESOLVED" | "REJECTED",
      resolution
    );

    return res.status(200).json({
      message: "Dispute updated successfully",
      data: updatedDispute,
    });
  } catch (err: any) {
    console.error("Error updating dispute:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};
