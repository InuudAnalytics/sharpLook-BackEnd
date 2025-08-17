import prisma from "../config/prisma";
import { ApprovalStatus, BookingStatus  } from '@prisma/client';


export const getVendorAnalytics = async (vendorId: string) => {
  // Fetch approved products sold by vendor
  const products = await prisma.product.findMany({
    where: {
      vendorId,
      approvalStatus: ApprovalStatus.APPROVED,
    },
    select: {
      id: true,
      productName: true,
      price: true,
      unitsSold: true,
      updatedAt: true,
    },
  });

  const totalProductRevenue = products.reduce((acc, p) => acc + p.unitsSold * p.price, 0);
  const totalUnitsSold = products.reduce((acc, p) => acc + p.unitsSold, 0);

  // Fetch bookings by vendor including client details
  const bookings = await prisma.booking.findMany({
    where: { vendorId },
    select: {
      id: true,
      date: true,
      serviceName: true,
      price: true,
      status: true,
      createdAt: true,
      client: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const completedBookings = bookings.filter(b => b.status === "COMPLETED");
  const bookingRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);

  // Count bookings created within the last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newBookingsCount = bookings.filter(b => b.createdAt >= oneWeekAgo).length;

  // Count disputes related to vendor bookings
  const disputesCount = await prisma.dispute.count({
    where: {
      booking: { vendorId },
    },
  });

  // Fetch vendor orders by vendor with order and user details
  const vendorOrders = await prisma.vendorOrder.findMany({
    where: { vendorId },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      order: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  // Filter completed vendorOrders and sum revenue
  const completedVendorOrders = vendorOrders.filter(vo => vo.status === "DELIVERED");
  const vendorOrderRevenue = completedVendorOrders.reduce((sum, vo) => sum + vo.total, 0);

  // Prepare recent earning items from bookings and vendorOrders in last 7 days
  const recentBookings = completedBookings.filter(b => b.createdAt >= oneWeekAgo);
  const recentVendorOrders = completedVendorOrders.filter(vo => vo.createdAt >= oneWeekAgo);

  const recentEarningItems = [
    ...recentBookings.map(b => ({
      type: "BOOKING" as const,
      sourceId: b.id,
      name: b.serviceName,
      amount: b.price,
      date: b.createdAt,
      clientDetails: b.client ? {
        firstName: b.client.firstName,
        lastName: b.client.lastName,
        email: b.client.email,
        phone: b.client.phone,
      } : null,
    })),
    ...recentVendorOrders.map(vo => ({
      type: "VENDOR_ORDER" as const,
      sourceId: vo.id,
      name: `Order #${vo.id}`,
      amount: vo.total,
      date: vo.createdAt,
      clientDetails: vo.order?.user ? {
        firstName: vo.order.user.firstName,
        lastName: vo.order.user.lastName,
        email: vo.order.user.email,
        phone: vo.order.user.phone,
      } : null,
    })),
  ];

  const recentEarnings = recentEarningItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    totalRevenue: totalProductRevenue + bookingRevenue + vendorOrderRevenue,
    totalProductRevenue,
    totalUnitsSold,
    bookingRevenue,
    vendorOrderRevenue,
    newBookingsCount,
    disputesCount,
    recentEarnings,
  };
};









export const getVendorEarningsGraphData = async (vendorId: string) => {
  // --- 1. Get product reviews/sales with timestamps ---
  const products = await prisma.product.findMany({
    where: {
      vendorId,
      approvalStatus: ApprovalStatus.APPROVED,  // filter only approved products
    },
    select: {
      id: true,
      price: true,
      unitsSold: true,
      updatedAt: true,
    },
  });

  // Optional: track product sales by updatedAt (assuming sale = update)
  const productEarningsByDate: Record<string, number> = {};
  for (const p of products) {
    const date = p.updatedAt.toISOString().split("T")[0];
    const total = p.price * p.unitsSold;
    productEarningsByDate[date] = (productEarningsByDate[date] || 0) + total;
  }

  // --- 2. Get completed bookings for this vendor ---
  const bookings = await prisma.booking.findMany({
    where: {
      vendorId,
      status: "COMPLETED",
      paymentStatus: "COMPLETED",
    },
    select: {
      date: true,
      totalAmount: true,
    },
  });

  const serviceEarningsByDate: Record<string, number> = {};
  for (const b of bookings) {
    const date = b.date.toISOString().split("T")[0];
    serviceEarningsByDate[date] = (serviceEarningsByDate[date] || 0) + b.totalAmount;
  }

  // --- 3. Merge product and service earnings ---
  const allDates = new Set([
    ...Object.keys(productEarningsByDate),
    ...Object.keys(serviceEarningsByDate),
  ]);

  const earningsByDate: Record<string, { product: number; service: number; total: number }> = {};
  for (const date of allDates) {
    const product = productEarningsByDate[date] || 0;
    const service = serviceEarningsByDate[date] || 0;
    earningsByDate[date] = {
      product,
      service,
      total: product + service,
    };
  }

  return { earningsByDate };
};

