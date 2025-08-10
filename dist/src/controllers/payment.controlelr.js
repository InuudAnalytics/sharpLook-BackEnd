"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaystackPayment = exports.createPaystackPayment = void 0;
const payment_service_1 = require("../services/payment.service");
const createPaystackPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, paymentFor, description } = req.body;
        const payment = await (0, payment_service_1.initiatePaystackPayment)(userId, amount, paymentFor, description);
        return res.status(200).json({
            success: true,
            paymentUrl: payment.authorization_url,
            reference: payment.reference,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Payment error" });
    }
};
exports.createPaystackPayment = createPaystackPayment;
const verifyPaystackPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        const transaction = await (0, payment_service_1.confirmPaystackPayment)(reference);
        return res.status(200).json({
            success: true,
            transaction,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Verification error" });
    }
};
exports.verifyPaystackPayment = verifyPaystackPayment;
