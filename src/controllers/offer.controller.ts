import { Request, Response } from "express";
import * as OfferService from "../services/offer.service";
import { createNotification, notifyNearbyVendors } from "../services/notification.service";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import { notifyUser } from "../helpers/notifyUser.helper"; 


export const handleCreateOffer = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const clientId = req.user?.id;

    // Ensure client is authenticated
    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Client not authenticated.",
      });
    }

    // // Basic input validation
    // const requiredFields = [
    //   "serviceName",
    //   "serviceType",
    //   "offerAmount",
    //   "fullAddress",
    //   "landMark",
    //   "date",
    //   "time",
    // ];
 

    // Validate offerAmount
    if (isNaN(Number(data.offerAmount)) || Number(data.offerAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Offer amount must be a valid positive number.",
      });
    }

    // Validate date and time
    const offerDate = new Date(data.date);
    if (isNaN(offerDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
    }

    // Handle image upload if present
    let serviceImageUrl = "";
    if (req.file) {
      try {
        const result = await uploadBufferToCloudinary(req.file.buffer, "SharpLook/ServiceOffers");
        serviceImageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Image upload failed. Please try again.",
        });
      }
    }

    const offer = await OfferService.createServiceOffer(
      clientId,
      data,
      serviceImageUrl
    );

  
    try {
      await notifyNearbyVendors(offer);
    } catch (notifyErr) {
      console.warn("Failed to notify vendors, but offer was created.");
    }

    return res.status(201).json({
      success: true,
      message: "Service offer created successfully.",
      data: offer,
    });
  } catch (err) {
    console.error("Offer creation error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

export const handleVendorAccept = async (req: Request, res: Response) => {
  try {
    const vendorId = req.user!.id;
    const { offerId, price } = req.body;

    const acceptance = await OfferService.vendorAcceptOffer(vendorId, offerId, price);

    
    return res.status(200).json({
      success: true,
      message: "Offer accepted successfully. Client has been notified.",
      data: acceptance,
    });

  } catch (error: any) {
    console.error("Controller error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};



export const selectVendorController = async (req: Request, res: Response) => {
  const { offerId, selectedVendorId, reference, paymentMethod, totalAmount } = req.body;
  const clientId = req.user!.id;
  console.log("this is body data", req.body);

  // Validate required fields dynamically based on payment method
  const requiredFields = ["offerId", "selectedVendorId", "paymentMethod"];

  // Only require reference if paymentMethod is not "Sharp Pay"
  if (paymentMethod !== "SHARP-PAY") {
    requiredFields.push("reference");
  }

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${field}`,
      });
    }
  }

  const result = await OfferService.selectVendorForOffer(
    offerId,
    selectedVendorId,
    reference,
    paymentMethod,
    totalAmount
  );

  if (result.success) {
    await createNotification(
      clientId,
      `Your booking for a service Offer has been placed successfully.`
    );
    await createNotification(
      selectedVendorId,
      `The Service offer you accepted has been acknowledged and requested`
    );

        // 🔔 Notify the vendor about new booking
    await notifyUser(
      selectedVendorId,
      `The Service offer you accepted has been acknowledged and requested` ,
      "BOOKING"
    );

    // 🔔 Optionally notify the client too
    await notifyUser(
      clientId,
      `Your booking for a service Offer has been placed successfully.`,
      "BOOKING"
    );

    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
};

export const handleGetVendorsForOffer = async (req: Request, res: Response) => {
  const { offerId } = req.body;

  const vendors = await OfferService.getVendorsForOffer(offerId);
  res.json({ success: true, data: vendors });
};


export const getNearbyOffersHandler = async (req: Request, res: Response) => {
  const vendorId = req.user!.id;

  try {
    const offers = await OfferService.getNearbyOffersByCoordinates(vendorId);
    res.status(200).json({ success: true, data: offers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleCancelOffer = async (req: Request, res: Response) => {
  const clientId = req.user!.id;
  const { offerId } = req.body;

  await OfferService.cancelOffer(offerId, clientId);
  res.json({ success: true, message: "Offer cancelled" });
};


export const getAllAvailableOffersHandler = async (req: Request, res: Response) => {
  try {
    const offers = await OfferService.getAllAvailableOffers(); 
    res.status(200).json({ success: true, data: offers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const getMyOffers = async (req: Request, res: Response) => {
  try {
    const clientId = req.user!.id;
    const offers = await OfferService.getClientOffers(clientId);
    res.json({ success: true, offers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const tipOffer = async (req: Request, res: Response) => {
  try {
    const clientId = req.user!.id;
    const {offerId, tipAmount } = req.body;

    if (!tipAmount || isNaN(tipAmount)) {
      return res.status(400).json({ message: "Invalid tip amount" });
    }

    const updatedOffer = await OfferService.addTipToOffer(clientId, offerId, Number(tipAmount));
    res.json({ success: true, message: "Tip added successfully", offer: updatedOffer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};