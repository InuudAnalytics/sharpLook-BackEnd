"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMyVirtualAcct = exports.createMyAcct = void 0;
const paystack_1 = require("../utils/paystack");
const createMyAcct = async (req, res) => {
    const { email, firstName, lastName, phone } = req.body;
    try {
        const response = await (0, paystack_1.createCustomer)(email, firstName, lastName, phone);
        console.log(response);
        if (response) {
            res.status(200).json({
                success: true,
                message: response
            });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.createMyAcct = createMyAcct;
const createMyVirtualAcct = async (req, res) => {
    const { customerCode, preferredBank, email } = req.body;
    try {
        const response = await (0, paystack_1.createVirtual)(customerCode, preferredBank, email);
        console.log(response);
        res.status(200).json({
            success: true,
            message: response
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.createMyVirtualAcct = createMyVirtualAcct;
