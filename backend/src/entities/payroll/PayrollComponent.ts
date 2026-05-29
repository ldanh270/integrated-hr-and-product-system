import {
  PAYROLL_COMPONENT_TYPES,
  PAYROLL_VALUE_TYPES,
} from "@/configs/constants/entities.config.ts"

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

    valueType: {
      type: String,
      enum: PAYROLL_VALUE_TYPES, // "fixed" | "percentage" | "formula"
      required: true,
    },

    // Giá trị mặc định — có thể override ở template level
    value: {
      type: Number,
      required: true,
      min: 0,
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

export const PayrollComponent = mongoose.model("PayrollComponent", payrollComponentSchema)
export type PayrollComponentType = InferSchemaType<typeof payrollComponentSchema>
export type PayrollComponentDocument = Document & PayrollComponentType
export type PayrollComponentModel = Model<PayrollComponentDocument>
