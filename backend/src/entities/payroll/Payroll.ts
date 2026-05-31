import { PAYROLL_STATUSES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const payrollSchema = new mongoose.Schema(
  {
    periodMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    periodYear: {
      type: Number,
      required: true,
      min: 2020,
    },

    status: {
      type: String,
      enum: PAYROLL_STATUSES,
      default: "draft",
      required: true,
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
)

// Compound unique: One payroll per month
payrollSchema.index({ periodYear: 1, periodMonth: 1 }, { unique: true })
payrollSchema.index({ status: 1 })

const Payroll = mongoose.model("Payroll", payrollSchema)

export default Payroll
export type PayrollType = InferSchemaType<typeof payrollSchema>
export type PayrollDocument = Document & PayrollType
export type PayrollModel = Model<PayrollDocument>
