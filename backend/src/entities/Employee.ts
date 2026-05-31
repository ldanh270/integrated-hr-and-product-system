import {
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYEE_TYPES,
} from "@/configs/constants/entities.config.ts"

import mongoose, { InferSchemaType } from "mongoose"

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't return password hash by default
    },

    role: {
      type: String,
      enum: EMPLOYEE_ROLES,
      default: "employee",
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Can be null but must be unique if provided
    },

    dateOfBirth: {
      type: Date,
    },

    nationalId: {
      type: String,
      unique: true,
      sparse: true,
    },

    address: {
      type: String,
    },

    avatar: {
      url: {
        type: String,
      },
      id: {
        type: String, // Cloudinary public id
      },
    },

    position: {
      type: String,
      trim: true,
    },

    employeeType: {
      type: String,
      enum: EMPLOYEE_TYPES,
      default: "full_time",
      required: true,
    },

    status: {
      type: String,
      enum: EMPLOYEE_STATUSES,
      default: "active",
      required: true,
    },

    failedLoginCount: {
      type: Number,
      default: 0,
      required: true,
    },

    lockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

employeeSchema.index({ status: 1, employeeType: 1 })
employeeSchema.index({ fullName: "text" })
employeeSchema.index({ role: 1 })

const Employee = mongoose.model("Employee", employeeSchema)

export default Employee

// Export types for reuse in Services/Controllers
export type EmployeeType = InferSchemaType<typeof employeeSchema>
