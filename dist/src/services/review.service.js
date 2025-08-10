"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductReviewsByVendor = exports.getServiceReviewsByVendor = exports.getVendorReviews = exports.createReview = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const createReview = async ({ vendorId, clientId, rating, comment, bookingId, productId, serviceId, type, }) => {
    const data = {
        vendor: { connect: { id: vendorId } },
        client: { connect: { id: clientId } },
        rating,
        comment,
        type,
    };
    if (bookingId) {
        data.booking = { connect: { id: bookingId } };
    }
    if (productId) {
        data.product = { connect: { id: productId } };
    }
    if (serviceId) {
        data.service = { connect: { id: serviceId } };
    }
    return await prisma_1.default.review.create({ data });
};
exports.createReview = createReview;
const getVendorReviews = async (vendorId, type) => {
    if (!vendorId)
        throw new Error("vendorId is required");
    const enumValues = Object.values(client_1.ReviewType);
    const isValidType = type && enumValues.includes(type);
    const enumType = isValidType ? type : undefined;
    return await prisma_1.default.review.findMany({
        where: {
            vendorId,
            ...(enumType ? { type: enumType } : {}),
            ...(type === 'PRODUCT' && {
                product: {
                    approvalStatus: client_2.ApprovalStatus.APPROVED,
                },
            }),
        },
        include: {
            client: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
            booking: {
                select: {
                    id: true,
                    date: true,
                    serviceName: true,
                },
            },
            product: {
                select: {
                    id: true,
                    productName: true,
                    picture: true,
                    approvalStatus: true,
                },
            },
            service: {
                select: {
                    id: true,
                    serviceName: true,
                    serviceImage: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getVendorReviews = getVendorReviews;
const getServiceReviewsByVendor = async (vendorId, serviceId) => {
    return await prisma_1.default.review.findMany({
        where: {
            vendorId,
            serviceId,
        },
        include: {
            client: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
            service: {
                select: {
                    id: true,
                    serviceName: true,
                    serviceImage: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getServiceReviewsByVendor = getServiceReviewsByVendor;
const getProductReviewsByVendor = async (vendorId, productId) => {
    return await prisma_1.default.review.findMany({
        where: {
            vendorId,
            productId,
            product: {
                approvalStatus: client_2.ApprovalStatus.APPROVED,
            },
        },
        include: {
            client: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
            product: {
                select: {
                    id: true,
                    productName: true,
                    picture: true,
                    approvalStatus: true, // optional to see
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getProductReviewsByVendor = getProductReviewsByVendor;
