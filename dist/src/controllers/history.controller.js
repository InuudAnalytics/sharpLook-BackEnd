"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUpcomingHistory = exports.fetchPastHistory = void 0;
const history_service_1 = require("../services/history.service");
const fetchPastHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const rawRole = req.user.role;
        if (!["CLIENT", "VENDOR"].includes(rawRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }
        const role = rawRole;
        const history = await (0, history_service_1.getPastBookings)(userId, role);
        return res.status(200).json({
            success: true,
            message: "Past bookings fetched successfully",
            data: history
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.fetchPastHistory = fetchPastHistory;
const fetchUpcomingHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const rawRole = req.user.role;
        if (!["CLIENT", "VENDOR"].includes(rawRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }
        const role = rawRole;
        const history = await (0, history_service_1.getUpcomingBookings)(userId, role);
        return res.status(200).json({
            success: true,
            message: "Upcoming bookings fetched successfully",
            data: history
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.fetchUpcomingHistory = fetchUpcomingHistory;
