"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post("/postReview", auth_middleware_1.verifyToken, review_controller_1.postReview);
router.post("/getAllReviews", review_controller_1.fetchVendorReviews);
router.post("/service", review_controller_1.handleGetServiceReviewsByVendor);
router.post("/product", review_controller_1.handleGetProductReviewsByVendor);
exports.default = router;
