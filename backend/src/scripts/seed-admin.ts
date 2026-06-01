import { CONNECTION_STRING } from "@/configs/database.config.ts"
import { ROLE } from "@/configs/role.config.ts"
import Employee from "@/entities/Employee.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import dotenv from "dotenv"
import mongoose from "mongoose"

dotenv.config()

/**
 * Script to seed a default admin user for testing
 */
const seedAdmin = async () => {
  try {
    if (!CONNECTION_STRING) {
      throw new Error("Missing MONGODB_CONNECTION_STRING")
    }

    await mongoose.connect(CONNECTION_STRING)
    console.log("Connected to MongoDB for seeding")

    // Check if admin already exists
    const existingAdmin = await Employee.findOne({
      $or: [{ email: "admin@hr.com" }, { username: "admin" }],
    })

    if (existingAdmin) {
      console.log("Admin already exists, updating password and username...")
      existingAdmin.passwordHash = await HashUtil.hash("Admin@123")
      existingAdmin.username = "admin"
      await existingAdmin.save()
    } else {
      console.log("Creating new admin...")
      await Employee.create({
        fullName: "System Admin",
        username: "admin",
        email: "admin@hr.com",
        passwordHash: await HashUtil.hash("Admin@123"),
        role: ROLE.ADMIN,
        status: "active",
        employeeType: "full_time",
      })
    }

    console.log("Seeding complete: username: admin / password: Admin@123")
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("Seeding error:", error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seedAdmin()
