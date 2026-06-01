import { PAYROLL_COMPONENT_TYPES } from "@/configs/entities/payroll.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const payrollComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      enum: PAYROLL_COMPONENT_TYPES, // "addition" | "deduction"
      required: true,
    },

    // Unified formula template for calculation
    formula: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true },
)

payrollComponentSchema.index({ type: 1, isActive: 1 })

const PayrollComponent = mongoose.model("PayrollComponent", payrollComponentSchema)

export default PayrollComponent
export type PayrollComponentType = InferSchemaType<typeof payrollComponentSchema>
export type PayrollComponentDocument = Document & PayrollComponentType
export type PayrollComponentModel = Model<PayrollComponentDocument>
