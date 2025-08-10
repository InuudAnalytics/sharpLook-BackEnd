"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorEarningsGraphData = exports.getVendorAnalytics = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const getVendorAnalytics = async (vendorId) => {
    // Fetch products sold by vendor, only approved ones
    const products = await prisma_1.default.product.findMany({
        where: {
            vendorId,
            approvalStatus: client_1.ApprovalStatus.APPROVED, // filter here to only approved products
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
    // Fetch bookings by vendor
    const bookings = await prisma_1.default.booking.findMany({
        where: { vendorId },
        select: {
            id: true,
            date: true,
            serviceName: true,
            price: true,
            status: true,
            createdAt: true,
        },
    });
    const completedBookings = bookings.filter(b => b.status === "COMPLETED");
    const bookingRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
    // Bookings created within the last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newBookingsCount = bookings.filter(b => b.createdAt >= oneWeekAgo).length;
    // Count disputes related to vendor bookings
    const disputesCount = await prisma_1.default.dispute.count({
        where: {
            booking: { vendorId },
        },
    });
    // Prepare recent earnings items from bookings and products in last 7 days
    const recentBookings = completedBookings.filter(b => b.createdAt >= oneWeekAgo);
    const recentEarningItems = [
        ...recentBookings.map(b => ({
            type: "BOOKING",
            sourceId: b.id,
            name: b.serviceName,
            amount: b.price,
            date: b.createdAt,
        })),
        ...products
            .filter(p => p.unitsSold > 0)
            .map(p => ({
            type: "PRODUCT",
            sourceId: p.id,
            name: p.productName,
            amount: p.price * p.unitsSold,
            date: p.updatedAt ?? new Date(),
        })),
    ];
    const recentEarnings = recentEarningItems
        .filter(e => e.date >= oneWeekAgo)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    return {
        totalRevenue: totalProductRevenue + bookingRevenue,
        totalProductRevenue,
        totalUnitsSold,
        bookingRevenue,
        newBookingsCount,
        disputesCount,
        recentEarnings,
    };
};
exports.getVendorAnalytics = getVendorAnalytics;
const getVendorEarningsGraphData = async (vendorId) => {
    // --- 1. Get product reviews/sales with timestamps ---
    const products = await prisma_1.default.product.findMany({
        where: {
            vendorId,
            approvalStatus: client_1.ApprovalStatus.APPROVED, // filter only approved products
        },
        select: {
            id: true,
            price: true,
            unitsSold: true,
            updatedAt: true,
        },
    });
    // Optional: track product sales by updatedAt (assuming sale = update)
    const productEarningsByDate = {};
    for (const p of products) {
        const date = p.updatedAt.toISOString().split("T")[0];
        const total = p.price * p.unitsSold;
        productEarningsByDate[date] = (productEarningsByDate[date] || 0) + total;
    }
    // --- 2. Get completed bookings for this vendor ---
    const bookings = await prisma_1.default.booking.findMany({
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
    const serviceEarningsByDate = {};
    for (const b of bookings) {
        const date = b.date.toISOString().split("T")[0];
        serviceEarningsByDate[date] = (serviceEarningsByDate[date] || 0) + b.totalAmount;
    }
    // --- 3. Merge product and service earnings ---
    const allDates = new Set([
        ...Object.keys(productEarningsByDate),
        ...Object.keys(serviceEarningsByDate),
    ]);
    const earningsByDate = {};
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
exports.getVendorEarningsGraphData = getVendorEarningsGraphData;
