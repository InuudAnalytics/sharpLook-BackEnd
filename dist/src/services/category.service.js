"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllServiceCategories = exports.createServiceCategory = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createServiceCategory = async (name) => {
    return await prisma_1.default.serviceCategory.create({
        data: { name },
    });
};
exports.createServiceCategory = createServiceCategory;
const getAllServiceCategories = async () => {
    return await prisma_1.default.serviceCategory.findMany({
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllServiceCategories = getAllServiceCategories;
