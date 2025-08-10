"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAdminAction = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logAdminAction = async (adminId, action, details) => {
    try {
        await prisma_1.default.adminAction.create({
            data: {
                adminId,
                action,
                details,
            },
        });
    }
    catch (err) {
        console.error('Failed to log admin action', err);
    }
};
exports.logAdminAction = logAdminAction;
