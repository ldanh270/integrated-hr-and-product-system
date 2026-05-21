/**
 * Connect to database
 * Using environment variables in .env file
 */
const connectDB = async () => {
  try {
    // TODO: Connect to database here

    console.log("Connect to database successfully")
  } catch (error) {
    console.error("Connect to database error:", error)
    process.exit(1)
  }
}

export { connectDB }
