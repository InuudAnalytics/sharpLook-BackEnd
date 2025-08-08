import express from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import * as ProductOrderController from "../controllers/productOrder.controller";

const router = express.Router();

router.post("/checkout", verifyToken, ProductOrderController.checkoutCart);
router.get("/getMyOrders", verifyToken, ProductOrderController.getMyOrders);
router.get("/getVendorOrders", verifyToken, ProductOrderController.getVendorOrders);

export default router;
