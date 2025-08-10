"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const BookingController = __importStar(require("../controllers/booking.controller"));
const booking_controller_1 = require("../controllers/booking.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = express_1.default.Router();
// Existing routes
router.post("/bookVendor", auth_middleware_1.verifyToken, BookingController.bookVendor);
router.get("/getBookings", auth_middleware_1.verifyToken, BookingController.getMyBookings);
router.patch("/status", auth_middleware_1.verifyToken, BookingController.changeBookingStatus);
// New routes for marking booking completed by client or vendor
router.patch("/complete/client", auth_middleware_1.verifyToken, BookingController.markBookingCompletedByClient);
router.patch("/complete/vendor", auth_middleware_1.verifyToken, BookingController.markBookingCompletedByVendor);
router.post("/", auth_middleware_1.verifyToken, BookingController.createHomeServiceBooking);
router.patch("/accept", auth_middleware_1.verifyToken, BookingController.acceptBookingHandler);
router.patch("/:bookingId/pay", auth_middleware_1.verifyToken, BookingController.payForBookingHandler);
// Home service 
// User creates booking
router.post("/createHomeServiceBooking", auth_middleware_1.verifyToken, upload_middleware_1.uploadReferencePhoto, booking_controller_1.createHomeServiceBooking);
// Vendor accepts booking
router.patch("/:bookingId/accept", auth_middleware_1.verifyToken, booking_controller_1.acceptBookingHandler);
// Client pays for booking after vendor acceptance
router.patch("/:bookingId/pay", auth_middleware_1.verifyToken, booking_controller_1.payForBookingHandler);
exports.default = router;
