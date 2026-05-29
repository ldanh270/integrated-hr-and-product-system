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

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false, // Bảo mật: Không tự động trả về khi query
    },

    role: {
      type: String,
      enum: EMPLOYEE_ROLES,
      default: "employee",
      required: true,
    },

    phone: {
      type: String,
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

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: EMPLOYEE_STATUSES,
      default: "active",
      required: true,
    },

    payrollTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollTemplate", // Liên kết tới model PayrollTemplate
    },

    failedLoginCount: {
      type: Number,
      default: 0,
      required: true,
    },

    lockedUntil: {
      type: Date,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Indexing để tối ưu hóa truy vấn
// Thường xuyên tìm kiếm nhân viên theo email, trạng thái hoặc loại nhân viên
employeeSchema.index({ status: 1, employeeType: 1 })

const Employee = mongoose.model("Employee", employeeSchema)

export default Employee

// Xuất type để tái sử dụng trong các Service/Controller
export type EmployeeType = InferSchemaType<typeof employeeSchema>
