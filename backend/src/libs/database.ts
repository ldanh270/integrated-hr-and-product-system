import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { CONNECTION_STRING } from "@/configs/system/db.config.ts"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Creates and configures a new PrismaClient instance.
 * @returns A new PrismaClient instance configured with a PostgreSQL adapter.
 */
function createPrismaClient() {
  const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: true
    }
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

/**
 * Establishes a connection to the PostgreSQL database using Prisma.
 * Exits the process if the connection fails.
 */
export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log("Connect to PostgreSQL database successfully via Prisma")
  } catch (error) {
    console.error("Connect to database error:", error)
    process.exit(1)
  }
}
