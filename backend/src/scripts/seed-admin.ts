import dotenv from "dotenv"
import mongoose from "mongoose"

import Employee from "../entities/Employee.ts"
import { HashUtil } from "../utils/hash.util.ts"

dotenv.config()

/**
 * Script to seed a default admin user for testing
 */
const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_CONNECTION_STRING) {
      throw new Error("Missing MONGODB_CONNECTION_STRING")
    }

    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    console.log("Connected to MongoDB for seeding")

    // Check if admin already exists
    const existingAdmin = await Employee.findOne({ 
      $or: [{ email: "admin@example.com" }, { username: "admin" }]
    })

    if (existingAdmin) {
      console.log("Admin already exists, updating password and username...")
      existingAdmin.passwordHash = await HashUtil.hash("Admin@123")
      existingAdmin.username = "admin"
      await existingAdmin.save()
    } else {
      console.log("Creating new admin...")
      await Employee.create({
        fullName: "System Administrator",
        username: "admin",
        email: "admin@example.com",
        passwordHash: await HashUtil.hash("Admin@123"),
        role: "admin",
        status: "active",
        employeeType: "full_time",
      })
    }

    console.log("Seeding complete: username: admin / password: Admin@123")
    process.exit(0)
  } catch (error) {
    console.error("Seeding error:", error)
    process.exit(1)
  }
}

seedAdmin()
