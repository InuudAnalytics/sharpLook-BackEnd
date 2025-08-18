
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes"
import vendorRoutes from "./routes/vendor.routes"
import userRoutes from "./routes/user.routes"
import bookingRoutes from "./routes/booking.routes"
import productRoutes from "./routes/product.routes"
import earningsRoutes from "./routes/earnings.routes"
import notificationsRoutes from "./routes/notification.routes"
import reviewRoutes from "./routes/review.routes"
import promotionRoutes from "./routes/promotion.routes"
import messageRoutes from "./routes/message.routes"
import vendorServiceRoutes from "./routes/vendorService.routes"
import historyRoutes from "./routes/history.routes"
import walletRoutes from "./routes/wallet.routes"
import referralRoutes from "./routes/referral.routes"
import adminRoutes from "./routes/admin.routes"
import disputeRoutes from "./routes/dispute.routes";
import paymentRoutes from "./routes/payment.routes"
import withdrawalRoutes from "./routes/withdrawal.routes";
import categoryRoutes from "./routes/category.routes"
import createOffersRoutes from "./routes/offer.routes"
import pushNotificationRoutes from './routes/pushNotification.routes';
import createMyAcctRoutes from './routes/virtualAcct.routes';

// For clients


import clientServiceRoutes from "./routes/clientService.routes"
import cartRoutes from "./routes/cart.routes"
import productOrderRoutes from "./routes/productOrder.route";
import distanceRoutes from "./routes/distance.routes"

import expoNotify from "./routes/expoNotify"





dotenv.config()

const app = express()

const allowedOrigins = [

  "*",

];

app.use(
  cors({
    origin: "*",
    credentials: true, // Allows cookies, authorization headers, etc.
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow common headers
  })
);

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    express.json()(req, res, next);
  } else {
    next();
  }
});


app.use(express.urlencoded({ extended: true }))
app.use("/api/v1/admin", adminRoutes)
app.use("/api/v1/expo", expoNotify)
app.use("/api/v1/vendor", vendorRoutes)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/user", userRoutes)
app.use("/api/v1/bookings", bookingRoutes)
app.use("/api/v1/products", productRoutes)
app.use("/api/v1/earnings", earningsRoutes)
app.use("/api/v1/notifications", notificationsRoutes)
app.use("/api/v1/reviews", reviewRoutes)
app.use("/api/v1/promotions", promotionRoutes)
app.use("/api/v1/messages", messageRoutes)
app.use("/api/v1/vendorServices", vendorServiceRoutes)
app.use("/api/v1/wallet", walletRoutes)
app.use("/api/v1/referrals", referralRoutes)
app.use("/api/v1/disputes", disputeRoutes);
app.use("/api/v1/distance", distanceRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/withdrawals", withdrawalRoutes);
app.use("/api/v1/serviceCategory", categoryRoutes);
app.use("/api/v1/offers", createOffersRoutes);




// For clients 

app.use("/api/v1/client", clientServiceRoutes)
app.use("/api/v1/client", cartRoutes)
app.use("/api/v1/history", historyRoutes)
app.use("/api/v1/orders", productOrderRoutes);
app.use("/api/v1", pushNotificationRoutes);
app.use("/api/v1", createMyAcctRoutes);



app.get("/", (_, res) => res.send("🚀 SharpLook API is running"))

const PORT = parseInt(process.env.PORT || '4000', 10);

// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

export default app