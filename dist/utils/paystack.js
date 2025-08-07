"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVirtual = exports.createCustomer = exports.sendTransfer = exports.createTransferRecipient = exports.getBanks = exports.generateReference = exports.verifyPayment = exports.initializePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const initializePayment = async (email, amount) => {
    console.log(typeof amount);
    try {
        const response = await axios_1.default.post("https://api.paystack.co/transaction/initialize", {
            email,
            amount: amount * 100,
            callback_url: "sharplookapp://BookAppointmentScreen/:id",
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                "Content-Type": "application/json",
            },
        });
        return response.data.data; // contains `authorization_url`, `access_code`, etc.
    }
    catch (error) {
        console.error("Payment initialization failed:", error.response?.data || error.message);
        throw new Error("Failed to initialize payment");
    }
};
exports.initializePayment = initializePayment;
const verifyPayment = async (reference) => {
    try {
        const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
            },
        });
        console.log("data got here oo");
        console.log("THis is response=> ", response.data);
        return response.data.data;
    }
    catch (error) {
        console.error("Payment verification failed:", error.response?.data || error.message);
        throw new Error("Failed to verify payment");
    }
};
exports.verifyPayment = verifyPayment;
const generateReference = () => `REF-${(0, uuid_1.v4)()}`;
exports.generateReference = generateReference;
const PAYSTACK_BASE = "https://api.paystack.co";
/**
 * ✅ Get List of Banks (for user selection)
 */
const getBanks = async () => {
    const response = await axios_1.default.get(`${PAYSTACK_BASE}/bank?country=nigeria`, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
    });
    return response.data.data; // Array of { name, code, slug }
};
exports.getBanks = getBanks;
const createTransferRecipient = async (name, accountNumber, bankCode) => {
    const response = await axios_1.default.post(`${PAYSTACK_BASE}/transferrecipient`, {
        type: "nuban",
        name: name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
    }, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
    });
    return response.data.data.recipient_code;
};
exports.createTransferRecipient = createTransferRecipient;
/**
 * ✅ Trigger Auto Withdrawal (Transfer)
 */
const sendTransfer = async (amount, recipientCode, reason, metadata = {}, retries = 2) => {
    const payload = {
        source: "balance",
        amount: amount * 100,
        recipient: recipientCode,
        reason,
        metadata,
    };
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await axios_1.default.post(`${PAYSTACK_BASE}/transfer`, payload, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    "Content-Type": "application/json",
                },
                timeout: 10000, // 10s timeout
            });
            return response.data.data;
        }
        catch (err) {
            if (i === retries || !isRetryablePaystackError(err)) {
                throw err;
            }
            console.warn(`⚠️ Retry transfer attempt ${i + 1}...`);
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
};
exports.sendTransfer = sendTransfer;
const isRetryablePaystackError = (err) => {
    const code = err?.response?.status;
    return code === 502 || code === 503 || code === 504 || err.code === 'ECONNABORTED';
};
const paystack = axios_1.default.create({
    baseURL: 'https://api.paystack.co',
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
    }
});
// Create Customer on Paystack
const createCustomer = async (email, firstName, lastName, phone) => {
    const response = await paystack.post('/customer', {
        email,
        first_name: firstName,
        last_name: lastName,
        phone
    });
    return response.data.data; // returns customer object
};
exports.createCustomer = createCustomer;
// Create Dedicated Virtual Account for a Customer
const createVirtual = async (customerCode, preferredBank = 'wema-bank', email) => {
    const response = await paystack.post('/dedicated_account', {
        customer: customerCode,
        preferred_bank: preferredBank,
        email,
    });
    return response.data.data; // returns dedicated account object
};
exports.createVirtual = createVirtual;
