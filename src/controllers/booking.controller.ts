import { Request, Response } from "express";
import * as BookingService from "../services/booking.service";
import { BookingStatus } from "@prisma/client";
import { createNotification } from "../services/notification.service";
import {
  homeServiceCreateBooking,
  acceptBooking,
  payForAcceptedBooking,
} from "../services/booking.service"
import uploadToCloudinary from "../utils/cloudinary";
import prisma from "../config/prisma";
import { pushNotificationService } from "../services/pushNotifications.service";
import { notifyUser } from "../helpers/notifyUser.helper"; 
import { io } from "../server"; // your Socket.io instance
export const bookVendor = async (req: Request, res: Response) => {
  const {
    vendorId,
    date,
    time,
    price,
    serviceName,
    serviceId,
    totalAmount,
    reference,
    paymentMethod,
  } = req.body;

  console.log("This is the vendor ID in booking:", vendorId);

  // Validate required fields
  if (!vendorId || !date || !time || !price || !serviceName || !serviceId || !totalAmount) {
    return res.status(400).json({
      success: false,
      message: "Missing required booking details",
    });
  }

  // Get client ID
  const clientId = req.user?.id;
  if (!clientId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: client ID is missing",
    });
  }

  // Format date and time
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  let referencePhoto = "";

  // Upload reference photo if provided
  if (req.file) {
    try {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.mimetype
      );
      referencePhoto = uploadResult.secure_url;
    } catch (uploadErr: any) {
      console.error("Image upload error:", uploadErr);
      return res.status(500).json({
        success: false,
        message: "Failed to upload reference photo. Please try again.",
      });
    }
  }

  try {
    // Create the booking
    const booking = await BookingService.createBooking(
      clientId,
      vendorId,
      serviceId,
      paymentMethod,
      serviceName,
      price,
      totalAmount,
      time,
      date,
      reference,
      referencePhoto
    );

    console.log("Booking created:", booking);

    if (!booking.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to create booking",
      });
    }

    // Fire notifications (non-blocking)
    Promise.all([
      createNotification(
        vendorId,
        `You received a new booking request for ${serviceName} on ${formattedDate} at ${formattedTime}.`
      ),
      createNotification(
        clientId,
        `Your booking for ${serviceName} has been placed successfully for ${formattedDate} at ${formattedTime}.`
      ),
      notifyUser(
        vendorId,
        "New Booking Request",
        `You have a new booking request for ${serviceName} on ${formattedDate} at ${formattedTime}.`
      ),
      notifyUser(
        clientId,
        "Booking Confirmed",
        `Your booking for ${serviceName} on ${formattedDate} at ${formattedTime} was successful.`
      ),
    ]).catch((notifyErr) => {
      console.error("Notification error:", notifyErr);
    });

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });

  } catch (err: any) {
    console.error("Booking error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create booking",
    });
  }
};


function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const parsedDate = new Date(dateString);
  return parsedDate.toLocaleDateString('en-US', options);
}


function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}



export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const role = req.user!.role as "CLIENT" | "VENDOR";

    console.log("This is my id in bgetting booings",req.user!.id);
    
    const bookings = await BookingService.getUserBookings(req.user!.id, role);

    return res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const changeBookingStatus = async (req: Request, res: Response) => {
  const { status, completedBy, reference, bookingId } = req.body;

  try {
    const booking = await BookingService.getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    let updatedBooking;

    if (status === "COMPLETED" && completedBy) {
      if (completedBy === "CLIENT") {
        updatedBooking = await BookingService.markBookingCompletedByClient(bookingId, reference);

        await createNotification(
          booking.vendorId,
          `Client marked booking for ${booking.serviceName} as completed.`
        );

        await notifyUser(
          booking.vendorId,
          "Booking Completed",
          `Client marked booking for ${booking.serviceName} as completed.`
        );

      } else if (completedBy === "VENDOR") {
        updatedBooking = await BookingService.markBookingCompletedByVendor(bookingId, reference);
        
         io.to(`booking_${bookingId}`).emit("bookingUpdated", {
          bookingId,
          status: updatedBooking.status,
          completedBy: completedBy || null,
        });
        await createNotification(
          booking.clientId!,
          `Vendor marked booking for ${booking.serviceName} as completed.`
        );

        await notifyUser(
          booking.clientId!,
          "Booking Completed",
          `Vendor marked booking for ${booking.serviceName} as completed.`
        );

      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid 'completedBy' value. Must be 'CLIENT' or 'VENDOR'."
        });
      }

    } else {
      // Normal status update: ACCEPTED, REJECTED, PENDING, etc.
      updatedBooking = await BookingService.updateBookingStatus(
        bookingId,
        status as BookingStatus
      );

      await createNotification(
        booking.clientId!,
        `Your booking for ${booking.serviceName} was ${status.toLowerCase()}.`
      );

      await createNotification(
        booking.vendorId,
        `You ${status.toLowerCase()} a booking for ${booking.serviceName}.`
      );

      await notifyUser(
          booking.clientId!,
          `Booking ${status} `,
          `Your booking for ${booking.serviceName} has been ${status}.`
        );

      if (status === "ACCEPTED") {
        await notifyUser(
          booking.clientId!,
          "Booking Accepted",
          `Your booking for ${booking.serviceName} has been accepted.`
        );
      }

      await notifyUser(
        booking.vendorId,
        "Booking Status Updated",
        `You ${status.toLowerCase()} a booking for ${booking.serviceName}.`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: updatedBooking,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const markBookingCompletedByClient = async (req: Request, res: Response) => {
  const { reference, bookingId } = req.body;

  try {
    const updatedBooking = await BookingService.markBookingCompletedByClient(
      bookingId,
      reference
    );
     io.to(`booking_${bookingId}`).emit("bookingUpdated", {
      bookingId: bookingId,
      status: updatedBooking.status,
      message: "Booking Completed by vendor",
    });

    return res.status(200).json({
      success: true,
      message: "Booking marked as completed by client.",
      data: updatedBooking,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Something went wrong" });
  }
};

export const markBookingCompletedByVendor = async (req: Request, res: Response) => {

  const {reference, bookingId} = req.body
  try {
    const updatedBooking = await BookingService.markBookingCompletedByVendor(bookingId, reference);

        io.to(`booking_${bookingId}`).emit("bookingUpdated", {
      bookingId: bookingId,
      status: updatedBooking.status,
      message: "Booking Completed by vendor",
    });

    return res.status(200).json({
      success: true,
      message: "Booking marked as completed by vendor.",
      data: updatedBooking,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};



// hpome servcie 


export const createHomeServiceBooking = async (req: Request, res: Response) => {
  try {

  const  clientId =  req.user!.id
    const {
      
      vendorId,
      serviceId,
      paymentMethod,
      serviceName,
      price,
      totalAmount,
      time,
      date,
      reference,
      serviceType,
      homeDetails,
    } = req.body
const booking = await homeServiceCreateBooking(
  clientId,
  vendorId,
  serviceId,
  paymentMethod,    
  serviceName,      
  parseFloat(price),        
  parseFloat(totalAmount),  
  time,            
  date,            
  reference,         
  serviceType,      
  homeDetails       
);

        // 🔔 Notify the vendor about new booking
    await notifyUser(
      vendorId,
      `You have a new booking for ${serviceName} on ${date} at ${time}.`,
      "BOOKING"
    );

    // 🔔 Optionally notify the client too
    await notifyUser(
      clientId,
      `Your booking with vendor has been created successfully.`,
      "BOOKING"
    );
    res.status(201).json({ success: true, message: "Booking created", data: booking })
  } catch (err: any) {
    console.error("Create booking error:", err);
    return res.status(500).json({
      error: err.message || "An unexpected server error occurred.",
    });
  }
}

export const acceptBookingHandler = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body
    const vendorId = req.user!.id

    const booking = await acceptBooking(vendorId, bookingId);


    console.log(`Emitting bookingUpdated to room: booking_${bookingId}`, { bookingId: booking.id, status: booking.status });

    io.to(`booking_${bookingId}`).emit("bookingUpdated", {
      bookingId: bookingId,
      status: booking.status,
      message: "Booking accepted by vendor",
    });

    if (booking.clientId) {
      await notifyUser(
        booking.clientId,
        'Booking Accepted',
        `Your booking for ${booking.serviceName} has been accepted.`
      );

      await createNotification(
        booking.clientId,
        `Your booking for ${booking.serviceName} has been accepted.`
      );
    }

    res.json({
      success: true,
      message: "Booking accepted",
      data: booking,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to accept booking",
    });
  }
};
export const payForBookingHandler = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const clientId = req.user!.id;
    const { reference, paymentMethod } = req.body;

    const booking = await payForAcceptedBooking(clientId, bookingId, reference, paymentMethod);

    // Notify Vendor about Payment
    if (booking.vendorId) {
      await notifyUser(
        booking.vendorId,
        'Payment Received',
        `You have received payment for the booking of ${booking.serviceName}.`
      );

      await createNotification(
        booking.vendorId,
        `You have received payment for the booking of ${booking.serviceName}.`
      );
    }

    res.json({ success: true, message: "Booking paid", data: booking });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to pay for booking",
    });
  }
};