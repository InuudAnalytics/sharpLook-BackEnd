"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    role: zod_1.z.enum(["CLIENT", "VENDOR", "ADMIN", "SUPERADMIN"]),
    acceptedPersonalData: zod_1.z.union([zod_1.z.boolean(), zod_1.z.literal("true"), zod_1.z.literal("false")]),
    phone: zod_1.z.string().optional(),
    referredByCode: zod_1.z.string().optional(),
});
