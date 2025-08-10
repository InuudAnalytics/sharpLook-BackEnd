"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
// src/utils/multer.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Use memory storage for Cloudinary
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (![".png", ".jpg", ".jpeg"].includes(ext)) {
            return cb(new Error("Only images are allowed"));
        }
        cb(null, true);
    },
});
