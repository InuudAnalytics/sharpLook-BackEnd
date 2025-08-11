"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function connectDB() {
    try {
        await prisma.$connect();
        console.log("✅ Database is connected");
    }
    catch (error) {
        console.error("❌ Database connection failed", error);
        process.exit(1);
    }
}
exports.default = prisma;
