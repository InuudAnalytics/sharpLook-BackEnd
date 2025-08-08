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
    const userId = req.user!.id
    const { reason,vendorOrderId  } = req.body;
    // const vendorOrderId = req.params.vendorOrderId;

    let disputeImage: string | undefined;
      if (req.file) {
        const result = await uploadBufferToCloudinary(req.file.buffer, "hairdesign/vendors");
        disputeImage = result.secure_url;
      }

    const dispute = await createVendorOrderDispute(vendorOrderId, userId, reason, disputeImage);
    return res.status(201).json(dispute);
  } catch (err : any) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

export const getAllVendorOrderDisputesHandler = async (req: Request, res: Response) => {
  try {
    const disputes = await getAllVendorOrderDisputes();
    return res.status(200).json(disputes);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch disputes" });
  }
};



export const updateVendorOrderDisputeStatusHandler = async (req: Request, res: Response) => {
  try {
    const { status, resolution, disputeId } = req.body;

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
