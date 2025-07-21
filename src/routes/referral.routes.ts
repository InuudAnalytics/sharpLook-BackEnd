import express from "express"
import { verifyToken } from "../middlewares/auth.middleware"
import { getReferralHistory } from "../controllers/referral.controller"

const router = express.Router()

router.get("/referralHistory", verifyToken, getReferralHistory)

export default router


// export const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
//   const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
//   if (!booking) throw new Error("Booking not found");

//   if (status === BookingStatus.ACCEPTED) {
//     if (booking.paymentMethod === "SHARP-PAY" && booking.paymentStatus !== PaymentStatus.LOCKED) {
//       const wallet = await getUserWallet(booking.clientId);
//       if (!wallet || wallet.balance < booking.price) {
//         throw new Error("Insufficient wallet balance");
//       }

//       await debitWallet(wallet.id, booking.price, "Booking Payment");

//       return await prisma.booking.update({
//         where: { id: bookingId },
//         data: {
//           status: BookingStatus.ACCEPTED,
//           paymentStatus: PaymentStatus.LOCKED,
//         },
//       });
//     }

//     // For other payment methods (CARD, etc.) or if already locked
//     return prisma.booking.update({
//       where: { id: bookingId },
//       data: { status: BookingStatus.ACCEPTED },
//     });
//   }

//   if (status === BookingStatus.REJECTED && booking.paymentStatus === PaymentStatus.LOCKED) {
//     const wallet = await getUserWallet(booking.clientId);
//     if (!wallet) throw new Error("Client wallet not found");

//     await creditWallet(wallet.id, booking.price, "Booking Refund");

//     return prisma.booking.update({
//       where: { id: bookingId },
//       data: {
//         status: BookingStatus.REJECTED,
//         paymentStatus: PaymentStatus.REFUNDED,
//       },
//     });
//   }

//   // For other statuses
//   return prisma.booking.update({
//     where: { id: bookingId },
//     data: { status },
//   });
// };


// export const createBooking = async (
//   clientId: string,
//   vendorId: string,
//   serviceId: string,
//   paymentMethod: string,
//   serviceName: string,
//   price: number,
//   totalAmount: number,
//   time: string,
//   date: string
// ) => {
// if (paymentMethod === "SHARP-PAY") {
//   // No debit here yet — we'll do it on acceptance
//   return await prisma.booking.create({
//     data: {
//       clientId,
//       vendorId,
//       serviceId,
//       totalAmount,
//       paymentMethod,
//       paymentStatus: PaymentStatus.PENDING, // Not locked yet
//       serviceName,
//       date,
//       time,
//       price,
//       status: BookingStatus.PENDING,
//     },
//   });
// }
//   // For other payment methods (CARD, etc), just create booking as usual with PENDING paymentStatus
//   return await prisma.booking.create({
//     data: {
//       clientId,
//       vendorId,
//       serviceId,
//       totalAmount,
//       paymentMethod,
//       paymentStatus: PaymentStatus.PENDING,
//       serviceName,
//       date,
//       time,
//       price,
//       status: BookingStatus.PENDING,
//     }
//   });
// }

