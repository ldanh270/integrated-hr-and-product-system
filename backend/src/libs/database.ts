/**
 * Connect to database
 */
import { CONNECTION_STRING } from "@/configs/system/server.config.ts"

import mongoose from "mongoose"

/**
 * Connect to database
 * - Using environment variables in .env file
 */
export const connectDB = async () => {
  try {
    if (!CONNECTION_STRING) {
      throw new Error("Missing MONGODB_CONNECTION_STRING in .env file")
    }
    await mongoose.connect(CONNECTION_STRING)

    console.log("Connect to database successfully")
  } catch (error) {
    console.error("Connect to database error:", error)
    process.exit(1)
  }
}
