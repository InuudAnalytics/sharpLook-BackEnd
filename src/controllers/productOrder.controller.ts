import { Request, Response } from "express";
import * as ProductOrderService from "../services/productOrder.service";
import { createNotification } from "../services/notification.service";
import { messaging } from "firebase-admin";
import { success } from "zod";

export const checkoutCart = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { reference } = req.body;

  try {
    const order = await ProductOrderService.checkoutCart(userId!, reference);

    await createNotification(
      userId!,
      `Your order of ₦${order!.total} was placed successfully.`
    );

    return res.status(201).json({
      success: true,
      message: reference
        ? "Order placed successfully using SHARP-PAY"
        : "Order placed successfully using wallet",
      data: order,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};


export const getMyOrders = async (req: Request, res: Response) => {

  const userId = req.user!.id

  try {

    const userOrders = await ProductOrderService.getClientOrdersWithVendors(userId)
    
    if (userOrders){
     return res.status(200).json({
        success: true,
        message : "Orders Gotten",
        data: userOrders

      })
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An Error Occured",
      error
    })
  }

}
export const getVendorOrders = async (req: Request, res: Response) => {

  const userId = req.user!.id

  try {

    const userOrders = await ProductOrderService.getVendorOrders(userId)
    
    if (userOrders){
     return res.status(200).json({
        success: true,
        message : "Orders Gotten",
        data: userOrders

      })
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An Error Occured",
      error
    })
  }

}


export const completeVendorOrderController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { vendorOrderId, role } = req.body; 

  if (!vendorOrderId || !role) {
    return res.status(400).json({
      success: false,
      message: "vendorOrderId and role are required",
    });
  }

  try {
    const updatedOrder = await ProductOrderService.completeVendorOrder(
      vendorOrderId,
      userId!,
      role
    );

    return res.status(200).json({
      success: true,
      message:
        updatedOrder.clientCompleted && updatedOrder.vendorCompleted
          ? "Order marked complete and payout processed"
          : "Order marked complete",
      data: updatedOrder,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
