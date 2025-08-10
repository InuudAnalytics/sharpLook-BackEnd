"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetServiceCategories = exports.handleCreateServiceCategory = void 0;
const category_service_1 = require("../services/category.service");
const handleCreateServiceCategory = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ success: false, message: "Service name is required" });
        const category = await (0, category_service_1.createServiceCategory)(name);
        res.status(201).json({
            success: true,
            message: "Service category created successfully",
            data: category,
        });
    }
    catch (error) {
        if (error.code === "P2002" &&
            error.meta?.target?.includes("name")) {
            return res.status(409).json({ success: false, message: "Service category already exists" });
        }
        next(error);
    }
};
exports.handleCreateServiceCategory = handleCreateServiceCategory;
const handleGetServiceCategories = async (req, res, next) => {
    try {
        const categories = await (0, category_service_1.getAllServiceCategories)();
        res.status(200).json({ success: true, data: categories });
    }
    catch (error) {
        next(error);
    }
};
exports.handleGetServiceCategories = handleGetServiceCategories;
