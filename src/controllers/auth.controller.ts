import { Request, Response } from "express";
import {

  registerUser,
  resetPassword,
  requestPasswordReset,
} from "../services/auth.service";
import { loginWithVendorCheck , loginWithClientCheck , loginUser} from "../services/auth.service";
import { sendOtpService, verifyOtpService } from "../services/otp.service";
import { getUserById } from "../services/auth.service";
import { GenericLoginResponse } from "../types/auth.types";
import prisma from "../config/prisma"
// ✅ Correct
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";




export const register = async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    phone,
    referredByCode,
    acceptedPersonalData,
  } = req.body;

  console.log("➡️ Register attempt:", { email, role });

  let accepted = false;
  if (
    acceptedPersonalData === true ||
    acceptedPersonalData === "true" ||
    acceptedPersonalData === "True"
  ) {
    accepted = true;
  }

  let user;

  try {
    // ✅ Step 1: Create user
    user = await registerUser(
      email,
      password,
      firstName,
      lastName,
      role,
      accepted,
      phone,
      referredByCode
    );
    console.log("✅ User registered:", user.id);
  } catch (err: any) {
    console.error("❌ Error during user creation:", err.message);

    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(409).json({
          success: false,
          step: "registerUser",
          message: `Duplicate entry for: ${err.meta?.target}`,
        });
      }
    }

    return res.status(400).json({
      success: false,
      step: "registerUser",
      message: "Failed to create user.",
      error: err.message,
    });
  }

  try {
    // ✅ Step 2: Send OTP after registration
    await sendOtpService(email);
    console.log("📨 OTP sent to email after registration");
  } catch (err: any) {
    console.error("❌ Failed to send OTP:", err.message);
    return res.status(500).json({
      success: false,
      step: "sendOtpService",
      message: "User created, but failed to send OTP. Please try again.",
      error: err.message,
      data: user,
    });
  }

  return res.status(201).json({
    success: true,
    message: "User registered successfully. OTP sent to email.",
    data: user,
  });
};




export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log("➡️ Login attempt:", email);

  try {
    const userCheck = await prisma.user.findUnique({ where: { email } });
    if (!userCheck) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

     else if (userCheck.role === "ADMIN" && !userCheck.powerGiven) {
      
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges not granted by SuperAdmin.",
      });
    }

    let responseData: GenericLoginResponse;

    if (userCheck.role === "VENDOR") {
      responseData = await loginWithVendorCheck(email, password);
    }
     else if (userCheck.role === "CLIENT") {
      responseData = await loginWithClientCheck(email, password);
    } 
    else {
      responseData = await loginUser(email, password);
    }

    const {
      token,
      user,
      vendorProfile = null, 
      message,
    } = responseData as any;

    if (!user.isOtpVerified) {
      await sendOtpService(email);
      return res.status(403).json({
        success: false,
        message: "Email or Phone Number not verified. An OTP has been sent to your email.",
      });
    }

    if (message) {
      return res.status(403).json({
        success: false,
        token,
        message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
      ...(vendorProfile && { vendorProfile }),
    });
  } catch (err: any) {
    console.error("❌ Login failed:", err.message);
    return res.status(401).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
};
export const requestReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log("➡️ Password reset requested for:", email);

  try {
    await requestPasswordReset(email);
    console.log("📨 Reset token sent to:", email);

    return res.status(200).json({
      success: true,
      message: "Reset token sent to your email",
    });
  } catch (err: any) {
    console.error("❌ Password reset request failed:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  }
};

export const reset = async (req: Request, res: Response) => {
  const { email, newPassword, token } = req.body;
  
  console.log("➡️ Password reset attempt:", { email, token });

  try {
    await resetPassword(email, token, newPassword);
    console.log("✅ Password reset successful");

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err: any) {
    console.error("❌ Password reset failed:", err.message);
    return res.status(400).json({
      success: false,
      message: "Password reset failed",
      error: err.message,
    });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  // const userId = req.user!.id
  const { email, phone } = req.body;
  console.log("➡️ Sending OTP to:", email);

  try {

    if (email){
         await sendOtpService(email);
    }
    else if (phone){
     
      
      await sendOtpService(phone)
      
    }
    console.log("✅ OTP sent successfully");

    return res.status(200).json({
      success: true,
      message: "OTP sent Successfully",
    });
  } catch (err: any) {
    console.error("❌ Failed to send OTP:", err.message);
    return res.status(400).json({
      success: false,
      message: "Failed to send OTP",
      error: err.message,
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, phone, otp } = req.body;
  console.log("➡️ Verifying OTP:", { email, otp });
 
  try {
     if (email){
     await verifyOtpService(email, otp);
  }
   else {
    await verifyOtpService(phone, otp)
   }
    console.log("✅ OTP verified successfully");

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err: any) {
    console.error("❌ OTP verification failed:", err.message);
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
      error: err.message,
    });
  }
};





export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const saveFcmToken = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ success: false, message: "FCM token is required" });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    return res.status(200).json({ success: true, message: "FCM token saved successfully" });
  } catch (err: any) {
    console.error("Failed to save FCM token:", err.message);
    return res.status(500).json({ success: false, message: "Failed to save FCM token" });
  }
};
