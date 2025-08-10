// routes/cart.routes.ts
import { Router } from "express"
import * as CartController from "../controllers/cart.controller"
import { verifyToken } from "../middlewares/auth.middleware"

const router = Router()

router.post("/addProductTocart", verifyToken, CartController.addProductToCart)
router.get("/getMycart", verifyToken, CartController.getMyCart)
router.delete("/removeProduct/:productId", verifyToken, CartController.removeProductFromCart)
router.put("/updateCartQty", verifyToken, CartController.updateCartItemQuantity);


export default router
