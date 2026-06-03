import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log("Connect to PostgreSQL database successfully via Prisma")
  } catch (error) {
    console.error("Connect to database error:", error)
    process.exit(1)
  }
}
