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
