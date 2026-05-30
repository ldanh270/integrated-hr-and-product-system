import { PAYROLL_COMPONENT_TYPES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const payslipDetailItemSubSchema = new mongoose.Schema(
  {
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: { type: String, required: true },
    type: { type: String, enum: PAYROLL_COMPONENT_TYPES, required: true },
    value: { type: Number, required: true },
  },
  { _id: false },
)

const payslipSchema = new mongoose.Schema(
  {
    payrollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAdditions: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },

    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    workingDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    absentDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Snapshot chi tiết từng thành phần lương — immutable sau khi tạo
    // Đây là audit trail: lưu lại ĐÚNG những gì đã tính tại thời điểm đó
    details: {
      type: [payslipDetailItemSubSchema],
      default: [],
    },
  },
  { timestamps: true },
)

// Compound unique: mỗi nhân viên chỉ có 1 payslip mỗi đợt
payslipSchema.index({ payrollId: 1, employeeId: 1 }, { unique: true })
// Query lịch sử lương của nhân viên
payslipSchema.index({ employeeId: 1, payrollId: -1 })

const Payslip = mongoose.model("Payslip", payslipSchema)

export default Payslip
export type PayslipType = InferSchemaType<typeof payslipSchema>
export type PayslipDocument = Document & PayslipType
export type PayslipModel = Model<PayslipDocument>
