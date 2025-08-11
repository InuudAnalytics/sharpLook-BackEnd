import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ Database is connected");
  } catch (error) {
    console.error("❌ Database connection failed", error);
    process.exit(1);
  }
}

export default prisma;
