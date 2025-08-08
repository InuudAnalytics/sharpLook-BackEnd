"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSmS = void 0;
const axios_1 = __importDefault(require("axios"));
const sendSmS = async (to, otpCOde) => {
    const sms = `Your Sharplook NG verification pin is : ${otpCOde}, pls do not share it give this code to anyone.`;
    try {
        const response = await axios_1.default.post("https://v3.api.termii.com/api/sms/send", {
            to,
            from: "N-Alert",
            sms,
            type: "plain", // Assuming plain is the required type
            channel: "dnd",
            api_key: process.env.TERMII_API_KEY
        });
        return response.data;
    }
    catch (error) {
        console.error("Error sending SMS:", error.data);
        // throw error;
    }
};
exports.sendSmS = sendSmS;
