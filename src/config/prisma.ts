import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function connectDB() {
  if (process.env.NODE_ENV === "test") {
    return; // ✅ Skip DB connection in tests
  }
  try {
    await prisma.$connect();
    console.log("✅ Database is connected");
  } catch (error) {
    console.error("❌ Database connection failed", error);
    process.exit(1);
  }
}

export default prisma;
