import prisma from "../config/prisma"
import { ApprovalStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors'; // adjust path

export const addToCart = async (userId: string, productId: string) => {
  // Step 1: Find product
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new ForbiddenError('Product is not approved for sale');
  }

  // Optional: Prevent duplicates
  const existingItem = await prisma.cartItem.findFirst({
    where: { userId, productId },
  });

  if (existingItem) {
    throw new BadRequestError('Product already in cart');
  }

  // Step 2: Add to cart
  return await prisma.cartItem.create({
    data: { userId, productId },
    include: { product: true },
  });
};


export const getUserCart = async (userId: string) => {
  // Step 1: Make sure user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Step 2: Fetch cart items with related product
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  // Step 3: Filter out products that are not approved
  const approvedItems = cartItems.filter(
    (item) => item.product?.approvalStatus === 'APPROVED'
  );

  if (approvedItems.length === 0) {
    throw new NotFoundError('No approved products in cart');
  }

  return approvedItems;
};



export const removeFromCart = async (userId: string, productId: string) => {
  return await prisma.cartItem.deleteMany({
    where: { userId, productId },
  })
}

export const updateMultipleCartItems = async (
  userId: string,
  updates: Array<{ productId: string; quantity: number }>
) => {
  const productIds = updates.map((item) => item.productId);

  // Fetch all relevant products and cart items
  const [products, cartItems] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
    }),
    prisma.cartItem.findMany({
      where: {
        userId,
        productId: { in: productIds },
      },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const cartItemMap = new Map(cartItems.map((ci) => [ci.productId, ci]));

  const updatesToApply = [];
  const updated: any[] = [];
  const removed: string[] = [];
  const errors: Array<{ productId: string; error: string }> = [];

  for (const { productId, quantity } of updates) {
    const product = productMap.get(productId);
    const cartItem = cartItemMap.get(productId);

    if (!product) {
      errors.push({ productId, error: 'Product not found' });
      continue;
    }

    if (product.approvalStatus !== ApprovalStatus.APPROVED) {
      errors.push({ productId, error: 'Product is not approved' });
      continue;
    }

    if (quantity > product.qtyAvailable) {
      errors.push({
        productId,
        error: `Only ${product.qtyAvailable} in stock`,
      });
      continue;
    }

    if (quantity <= 0) {
      if (cartItem) {
        updatesToApply.push(
          prisma.cartItem
            .delete({ where: { id: cartItem.id } })
            .then(() => removed.push(productId))
        );
      }
    } else if (cartItem) {
      updatesToApply.push(
        prisma.cartItem
          .update({
            where: { id: cartItem.id },
            data: { quantity },
          })
          .then((item) => updated.push(item))
      );
    } else {
      updatesToApply.push(
        prisma.cartItem
          .create({
            data: {
              userId,
              productId,
              quantity,
            },
          })
          .then((item) => updated.push(item))
      );
    }
  }

  // Wait for all Prisma actions to finish
  await Promise.all(updatesToApply);

  return {
    updated,
    removed,
    errors,
  };
};

