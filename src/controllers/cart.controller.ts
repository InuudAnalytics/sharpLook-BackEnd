import { Request, Response } from "express"
import * as CartService from "../services/cart.service"

export const addProductToCart = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required"
    });
  }

  try {
    const cartItem = await CartService.addToCart(userId, productId);
    return res.status(201).json({
      success: true,
      message: "Product added to cart successfully",
      data: cartItem
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const getMyCart = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const cart = await CartService.getUserCart(userId);
    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: cart
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const removeProductFromCart = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.params;

  try {
    await CartService.removeFromCart(userId, productId);
    return res.status(200).json({
      success: true,
      message: "Product removed from cart"
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

