import { Router } from "express"
import { authenticate } from "../middlewares/authenticate";
import {getCurrentUser, register, login, requestReset, reset, saveFcmToken } from "../controllers/auth.controller"
import { sendOtp, verifyOtp } from "../controllers/auth.controller"
import { registerVendor } from "../controllers/vendorOnboarding.controller"
import { uploadSingle } from "../middlewares/upload.middleware"
import { validate } from "../middlewares/validate";
import { registerSchema } from "../validations/auth.schema";



const router = Router()


router.get("/me", authenticate, getCurrentUser);
router.post("/register", register)
router.post("/login", login)
router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtp)
router.post("/request-password-reset", requestReset)
router.post("/reset-password", reset)
router.post("/register-vendor", uploadSingle, registerVendor)
router.post('/savePushToken', saveFcmToken);

export default router
