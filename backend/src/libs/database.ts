import { CONNECTION_STRING } from "@/configs/system/db.config.ts"
import { ENVIRONMENT, ENV_ENVIRONMENT } from "@/configs/system/server.config.ts"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Creates and configures a new PrismaClient instance.
 * @returns A new PrismaClient instance configured with a PostgreSQL adapter.
 */
function createPrismaClient() {
  const isProduction = ENV_ENVIRONMENT === ENVIRONMENT.PRODUCTION
  const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: isProduction
      ? { rejectUnauthorized: false }
      : undefined,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
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
