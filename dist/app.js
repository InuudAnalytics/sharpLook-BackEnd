"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const vendor_routes_1 = __importDefault(require("./routes/vendor.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const earnings_routes_1 = __importDefault(require("./routes/earnings.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const promotion_routes_1 = __importDefault(require("./routes/promotion.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const vendorService_routes_1 = __importDefault(require("./routes/vendorService.routes"));
const history_routes_1 = __importDefault(require("./routes/history.routes"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const referral_routes_1 = __importDefault(require("./routes/referral.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const dispute_routes_1 = __importDefault(require("./routes/dispute.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const withdrawal_routes_1 = __importDefault(require("./routes/withdrawal.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const offer_routes_1 = __importDefault(require("./routes/offer.routes"));
const pushNotification_routes_1 = __importDefault(require("./routes/pushNotification.routes"));
const virtualAcct_routes_1 = __importDefault(require("./routes/virtualAcct.routes"));
const agoraRoutes_1 = __importDefault(require("./routes/agoraRoutes"));
// For clients
const clientService_routes_1 = __importDefault(require("./routes/clientService.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const productOrder_route_1 = __importDefault(require("./routes/productOrder.route"));
const distance_routes_1 = __importDefault(require("./routes/distance.routes"));
const expoNotify_1 = __importDefault(require("./routes/expoNotify"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = [
    "*",
];
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true, // Allows cookies, authorization headers, etc.
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow common headers
}));
app.use((req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
        express_1.default.json()(req, res, next);
    }
    else {
        next();
    }
});
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/v1/admin", admin_routes_1.default);
app.use("/api/v1/expo", expoNotify_1.default);
app.use("/api/v1/vendor", vendor_routes_1.default);
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/user", user_routes_1.default);
app.use("/api/v1/bookings", booking_routes_1.default);
app.use("/api/v1/products", product_routes_1.default);
app.use("/api/v1/earnings", earnings_routes_1.default);
app.use("/api/v1/notifications", notification_routes_1.default);
app.use("/api/v1/reviews", review_routes_1.default);
app.use("/api/v1/promotions", promotion_routes_1.default);
app.use("/api/v1/messages", message_routes_1.default);
app.use("/api/v1/vendorServices", vendorService_routes_1.default);
app.use("/api/v1/wallet", wallet_routes_1.default);
app.use("/api/v1/referrals", referral_routes_1.default);
app.use("/api/v1/disputes", dispute_routes_1.default);
app.use("/api/v1/distance", distance_routes_1.default);
app.use("/api/v1/payment", payment_routes_1.default);
app.use("/api/v1/withdrawals", withdrawal_routes_1.default);
app.use("/api/v1/serviceCategory", category_routes_1.default);
app.use("/api/v1/offers", offer_routes_1.default);
app.use('/api/v1/agora', agoraRoutes_1.default);
// For clients 
app.use("/api/v1/client", clientService_routes_1.default);
app.use("/api/v1/client", cart_routes_1.default);
app.use("/api/v1/history", history_routes_1.default);
app.use("/api/v1/orders", productOrder_route_1.default);
app.use("/api/v1", pushNotification_routes_1.default);
app.use("/api/v1", virtualAcct_routes_1.default);
app.get("/", (_, res) => res.send("🚀 SharpLook API is running"));
const PORT = parseInt(process.env.PORT || '4000', 10);
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });
exports.default = app;
