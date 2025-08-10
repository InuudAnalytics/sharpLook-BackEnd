"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingBookings = exports.getPastBookings = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const getPastBookings = async (userId, role) => {
    return await prisma_1.default.booking.findMany({
        where: {
            [role === "CLIENT" ? "clientId" : "vendorId"]: userId,
            status: client_1.BookingStatus.COMPLETED,
        },
        orderBy: { date: "asc" }
    });
};
exports.getPastBookings = getPastBookings;
const getUpcomingBookings = async (userId, role) => {
    return await prisma_1.default.booking.findMany({
        where: {
            [role === "CLIENT" ? "clientId" : "vendorId"]: userId,
            status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.ACCEPTED] },
        },
        orderBy: { date: "asc" }
    });
};
exports.getUpcomingBookings = getUpcomingBookings;
