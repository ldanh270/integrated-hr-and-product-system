import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { parse } from "pg-connection-string"


const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  const poolConfig = parse(connectionString || "")
  poolConfig.ssl = {
    rejectUnauthorized: true
  }
  const pool = new Pool(poolConfig)
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

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
