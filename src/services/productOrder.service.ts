import prisma from "../config/prisma";
// Notification & email utils
import { createNotification } from "./notification.service";
import { sendVendorOrderEmail } from "../helpers/email.helper";
import { debitWallet, getUserWallet } from "./wallet.service";
import { VendorOrderStatus } from "@prisma/client"; 


export const checkoutCart = async (userId: string, reference?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      cartItems: {
        include: {
          product: {
            include: { vendor: true },
          },
        },
      },
    },
  });

  if (!user || !user.wallet) throw new Error("User or wallet not found");
  const cartItems = user.cartItems;
  if (!cartItems || cartItems.length === 0) throw new Error("Your cart is empty");

  // Calculate total
  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Check wallet balance when not using an external reference
  if (!reference && user.wallet.balance < totalAmount) {
    throw new Error("Insufficient wallet balance");
  }

  // Group items by vendor
  const vendorMap: Record<
    string,
    {
      vendorEmail: string;
      vendorName: string;
      items: { productId: string; productName: string; quantity: number; price: number; total: number }[];
    }
  > = {};

  const vendorIds: string[] = [];
  const orderItemsPayload: {
    productId: string;
    quantity: number;
    price: number;
    total: number;
  }[] = [];

  for (const cartItem of cartItems) {
    const product = cartItem.product;
    if (!product) throw new Error(`Product for cart item ${cartItem.id} not found`);

    const vendor = product.vendor!;
    const vendorId = vendor.id;

    if (!vendorIds.includes(vendorId)) vendorIds.push(vendorId);

    const itemTotal = cartItem.quantity * product.price;

    // for creating OrderItem rows
    orderItemsPayload.push({
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      price: product.price,
      total: itemTotal,
    });

    // group for vendor notification & vendorOrder
    if (!vendorMap[vendorId]) {
      vendorMap[vendorId] = {
        vendorEmail: vendor.email,
        vendorName: `${vendor.firstName} ${vendor.lastName}`,
        items: [],
      };
    }

    vendorMap[vendorId].items.push({
      productId: cartItem.productId,
      productName: product.productName,
      quantity: cartItem.quantity,
      price: product.price,
      total: itemTotal,
    });
  }

  // Create everything inside a transaction
  const createdOrder = await prisma.$transaction(async (tx) => {
    // Debit wallet if paying from wallet
    if (!reference) {
      await debitWallet(user.wallet!.id, totalAmount, "Cart checkout", "WALLET-CHECKOUT");
    }

    // update product stocks & unitsSold
    for (const cartItem of cartItems) {
      await tx.product.update({
        where: { id: cartItem.productId },
        data: {
          qtyAvailable: { decrement: cartItem.quantity },
          unitsSold: { increment: cartItem.quantity },
        },
      });
    }

    // Create the top-level order
    const order = await tx.order.create({
      data: {
        userId,
        vendorIds,
        total: totalAmount,
        reference: reference ?? "WALLET-CHECKOUT",
      },
    });

    // Create OrderItem rows (one per cart item)
    for (const oi of orderItemsPayload) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: oi.productId,
          quantity: oi.quantity,
          price: oi.price,
          total: oi.total,
        },
      });
    }

    // Create VendorOrder rows
    for (const [vendorId, data] of Object.entries(vendorMap)) {
      const vendorTotal = data.items.reduce((s, it) => s + it.total, 0);
      await tx.vendorOrder.create({
        data: {
          orderId: order.id,
          vendorId,
          items: data.items as any, // vendorOrder.items is Json in your schema
          total: vendorTotal,
        },
      });
    }

    // Clear user's cart
    await tx.cartItem.deleteMany({ where: { userId } });

    return order;
  });

  // After transaction — send notifications / emails
  for (const [vendorId, data] of Object.entries(vendorMap)) {
    const vendorTotal = data.items.reduce((s, it) => s + it.total, 0);

    await createNotification(vendorId, `You've sold ${data.items.length} item(s) totaling ₦${vendorTotal}.`);

    await sendVendorOrderEmail(data.vendorEmail, {
      name: data.vendorName,
      clientName: `${user.firstName} ${user.lastName}`,
      phone: `${user.phone}`,
      items: data.items,
      total: vendorTotal,
    });
  }

  // Return the created order with items & product->vendor populated for frontend
  const orderWithItems = await prisma.order.findUnique({
    where: { id: createdOrder.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true },
              },
            },
          },
        },
      },
      vendorOrders: true, // optional: include vendorOrders if you want
    },
  });

  return orderWithItems;
};


export const getClientOrdersWithVendors = async (clientId: string) => {
  const orders = await prisma.order.findMany({
    where: { userId: clientId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              productName: true,
              picture: true,
              vendor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  avatar: true,
                  vendorOnboarding: {
                    select: { businessName: true },
                  },
                },
              },
            },
          },
        },
      },
      vendorOrders: {
        select: {
          id: true,          // ✅ Needed for completion
          vendorId: true,
          hasDispute: true,
          status: true,
        },
      },
    },
  });

  const formattedOrders = orders.map(order => ({
    id: order.id,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items.map(item => {
      const vendorOrder = order.vendorOrders.find(
        vo => vo.vendorId === item.product.vendor.id
      );

      return {
        productId: item.product.id,
        productName: item.product.productName,
        productImage: item.product.picture,
        quantity: item.quantity,
        price: item.price,
        vendorOrderId: vendorOrder?.id || null,
        hasDispute: vendorOrder?.hasDispute,
        vendor: {
          id: item.product.vendor.id,
          firstName: item.product.vendor.firstName,
          lastName: item.product.vendor.lastName,
          email: item.product.vendor.email,
          phone: item.product.vendor.phone,
          avatar: item.product.vendor.avatar || null,
          businessName:
            item.product.vendor.vendorOnboarding?.businessName || null,
          status: vendorOrder?.status || null,
        },
      };
    }),
  }));

  return formattedOrders;
};




export const getVendorOrders = async (vendorId: string) => {

  return await prisma.vendorOrder.findMany({
    where: { vendorId },
    include: {
      order: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true , location: true } },
          items: {
            include: {
              product: true, // include vendor? not necessary here but possible
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateVendorOrderStatus = async (
  vendorOrderId: string,
  status: VendorOrderStatus
) => {
  const validStatuses: VendorOrderStatus[] = ["PENDING", "PROCESSING", "DELIVERED", "COMPLETED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  return await prisma.vendorOrder.update({
    where: { id: vendorOrderId },
    data: { status },
  });
};
export const completeVendorOrder = async (
  vendorOrderIds: string[],
  userId: string,
  role: "CLIENT" | "VENDOR"
) => {
  if (!Array.isArray(vendorOrderIds) || vendorOrderIds.length === 0) {
    throw new Error("vendorOrderIds must be a non-empty array");
  }

  // Fetch all vendor orders
  const vendorOrders = await prisma.vendorOrder.findMany({
    where: { id: { in: vendorOrderIds } },
    include: {
      vendor: { include: { wallet: true } },
      order: true
    },
  });

  if (vendorOrders.length !== vendorOrderIds.length) {
    throw new Error("One or more vendor orders not found");
  }

  // Check for pending disputes
  const disputes = await prisma.vendorOrderDispute.findMany({
    where: { vendorOrderId: { in: vendorOrderIds }, status: "PENDING" },
  });
  if (disputes.length > 0) {
    throw new Error(
      `Cannot complete orders: disputes pending for order(s) ${disputes
        .map(d => d.vendorOrderId)
        .join(", ")}`
    );
  }

  // STEP 1 & 2 combined: Mark delivered + process payout
  const updatedOrders = await Promise.all(
    vendorOrders.map(async (order) => {
      // If client marks delivered, mark both sides complete
      const clientCompleted = role === "CLIENT" ? true : order.clientCompleted;
      const vendorCompleted = role === "CLIENT"
        ? true
        : role === "VENDOR"
        ? true
        : order.vendorCompleted;

      // Only trigger payout if not already paid
      let paidOut = order.paidOut;

      if (clientCompleted && vendorCompleted && !paidOut) {
        const vendorWallet = order.vendor.wallet;
        if (!vendorWallet) throw new Error("Vendor wallet not found");

        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: vendorWallet.id },
            data: { balance: { increment: order.total } },
          }),
          prisma.transaction.create({
            data: {
              amount: order.total,
              type: "CREDIT",
              reference: `ORDER-PAYOUT-${order.id}`,
              description: `Payout for order ${order.order.reference ?? order.order.id}`,
              walletId: vendorWallet.id,
              status: "SUCCESS",
            },
          }),
          prisma.vendorOrder.update({
            where: { id: order.id },
            data: {
              clientCompleted,
              vendorCompleted,
              status: "DELIVERED",
              paidOut: true,
            },
          }),
        ]);

        paidOut = true;
      } else {
        // Just mark as delivered without payout
        await prisma.vendorOrder.update({
          where: { id: order.id },
          data: {
            clientCompleted,
            vendorCompleted,
            status: "DELIVERED",
          },
        });
      }

      return {
        ...order,
        clientCompleted,
        vendorCompleted,
        paidOut,
        status: "DELIVERED",
      };
    })
  );

  return updatedOrders;
};





