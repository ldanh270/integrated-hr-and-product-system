/**
 * Connect to database
 * Using environment variables in .env file
 */
import mongoose from "mongoose"

/**
 * Connect to database
 * - Using environment variables in .env file
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_CONNECTION_STRING) {
      throw new Error("Missing MONGODB_CONNECTION_STRING in .env file")
    }
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)

    console.log("Connect to database successfully")
  } catch (error) {
    console.error("Connect to database error:", error)
    process.exit(1)
  }
}

export { connectDB }
