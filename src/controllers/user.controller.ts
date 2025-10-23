import { Request, Response } from "express"
import {
  getUserById,
  updateUserProfile,
  updateClientLocationPreferences,
  getTopRatedVendors,
 getVendorDetails,
 getAllVendors,
 updateUserAvatar,
 deleteUserAccount
} from "../services/user.services"

import prisma from "../config/prisma"

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.user!.id)
    res.status(200).json({ success: true, data: user })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const updated = await updateUserProfile(req.user!.id, req.body)
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const setClientLocationPreferences = async (
  req: Request,
  res: Response
) => {
  const { latitude, longitude, radiusKm } = req.body
  const userId = req.user?.id!

  if (!latitude || !longitude || !radiusKm) {
    return res.status(400).json({
      success: false,
      message: "Missing required location fields: latitude, longitude, radiusKm",
    })
  }

  try {
    const updatedUser = await updateClientLocationPreferences(
      userId,
      latitude,
      longitude,
      radiusKm
    )
    res.status(200).json({
      success: true,
      message: "Location preferences updated successfully",
      data: updatedUser,
    })
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message })
  }
}

export const fetchTopVendors = async (req: Request, res: Response) => {
  console.log("🔍 Received request to fetch top vendors")

  const limit = parseInt(req.query.limit as string) || 10
  console.log(`📌 Parsed limit from query: ${limit}`)

  try {
    console.log("🚀 Fetching top rated vendors...")
    const topVendors = await getTopRatedVendors(limit)
    console.log("✅ Top vendors fetched successfully")

    res.status(200).json({
      success: true,
      message: "Top vendors fetched successfully",
      data: topVendors,
    })
    console.log("📤 Response sent to client")
  } catch (err: any) {
    console.error("❌ Error occurred while fetching top vendors:", err)
    res.status(500).json({ success: false, message: err.message })
  }
}

export const fetchAllVendors = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const result = await getAllVendors(page, limit);

    res.status(200).json({
      success: true,
      message: "All vendors fetched successfully",
      data: result.vendors,
      pagination: result.pagination,
    });
  } catch (err: any) {
    console.error("❌ Error occurred while fetching vendors:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};




export const getAVendorDetails = async (req: Request, res: Response) => {
  const {vendorId} = req.body

  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: "Missing vendorId in request parameters"
    });
  }

  try {
    const vendorDetails = await getVendorDetails(vendorId)

    if (!vendorDetails) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Vendor details fetched successfully",
      data: vendorDetails,
    })
  } catch (err: any) {
    console.error("❌ Failed to get vendor details:", err)
    res.status(500).json({ success: false, message: err.message })
  }
}



export const updateAvatar = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    const avatarUrl = await updateUserAvatar(userId!, req.file.buffer);

    return res.status(200).json({
      message: "Avatar updated successfully",
      avatar: avatarUrl,
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
};


export const handleDeleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; 

    const result = await deleteUserAccount(userId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Delete account error:", error.message);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

export const updateFcmToken = async (req:Request, res: Response) => {
  const userId = req.user!.id
  const { fcmToken } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};