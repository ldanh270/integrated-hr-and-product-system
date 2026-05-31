import dotenv from "dotenv"
import mongoose from "mongoose"

dotenv.config()

export const clearDatabase = async () => {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection is not ready")
  }

  console.log("🧹 Dropping database...")
  await mongoose.connection.db.dropDatabase()
}

const main = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_STRING
    if (!mongoUri) throw new Error("Missing MONGODB_CONNECTION_STRING")

    await mongoose.connect(mongoUri)
    console.log("🚀 Connected to MongoDB")

    await clearDatabase()

    console.log("✨ Database cleared")
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Clear database failed:", error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

const isMain = process.argv[1]?.includes("clear-db.ts") || process.argv[1]?.includes("clear-db.js")

if (isMain) {
 main()
}
