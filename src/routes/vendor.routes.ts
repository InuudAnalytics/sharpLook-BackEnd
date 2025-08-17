// src/routes/vendor.routes.ts
import { Router } from "express"
import { verifyToken, requireRole } from "../middlewares/auth.middleware"
import { completeVendorProfile, getVendorSubscriptionController, markVendorAsPaidController } from "../controllers/vendor.controller"
import { uploadPortfolioImages,
         fetchPortfolioImages, 
         fetchAvailability, 
         updateAvailability,
        updateServiceRadius,
     editVendorProfile,
    fetchAllServiceCategories,
  filterVendorsByService } from "../controllers/vendor.controller"
import { uploadMultiple } from "../middlewares/upload.middleware"
import { setVendorPricing, fetchVendorPricing } from "../controllers/vendorPricing.controller"
import { fetchVendorAnalytics ,fetchVendorEarningsGraph } from "../controllers/vendorAnalytics.controller";

import {fetchServiceCategories} from "../controllers/admin.controller"




const router = Router()

router.get("/dashboard", verifyToken, requireRole(["VENDOR"]),(req, res) => {
res.json({ message: "Welcome, Vendor!" })
  }
)
router.put("/complete-profile", verifyToken,uploadMultiple, requireRole(["VENDOR"]), completeVendorProfile)
router.post("/upload", verifyToken, requireRole(["VENDOR"]), uploadMultiple,  uploadPortfolioImages)
router.get("/fetchPortfolioImage", verifyToken, requireRole(["VENDOR"]), fetchPortfolioImages)
router.get("/getVendorPricing", verifyToken, requireRole(["VENDOR"]), fetchVendorPricing)
router.post("/setVendorPricing", verifyToken, requireRole(["VENDOR"]), setVendorPricing)
router.get("/getCategories",  fetchServiceCategories);
router.get("/filter-by-service", filterVendorsByService)
router.post("/setVendorAvailability", verifyToken, requireRole(["VENDOR"]), updateAvailability)
router.get("/getVendorAvailability", verifyToken, requireRole(["VENDOR"]),  fetchAvailability)
router.put("/update-service-radius",verifyToken,requireRole(["VENDOR"]),updateServiceRadius)
router.get("/analytics/:vendorId", verifyToken, fetchVendorAnalytics);
router.get("/earnings-graph", verifyToken, requireRole(["VENDOR"]), fetchVendorEarningsGraph);
router.post('/mark-vendor-paid', verifyToken,  requireRole(["VENDOR"]), markVendorAsPaidController );
router.get('/getMySub', verifyToken,  requireRole(["VENDOR"]), getVendorSubscriptionController );


router.put(
  "/profile/edit",verifyToken,
  requireRole(["VENDOR"]),uploadMultiple,
  editVendorProfile
);





export default router
