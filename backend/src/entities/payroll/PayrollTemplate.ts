import { PAYROLL_COMPONENT_TYPES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const templateComponentSubSchema = new mongoose.Schema(
  {
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollComponent",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: PAYROLL_COMPONENT_TYPES,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    // Override default component value for this template
    overrideValue: {
      type: Number,
      default: null,
    },
  },
  { _id: false }, // Prevent generating _id for embedded array items
)

const payrollTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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

    // Embed component snapshot for calculation without $lookup
    components: {
      type: [templateComponentSubSchema],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true },
)

payrollTemplateSchema.index({ isActive: 1 })

const PayrollTemplate = mongoose.model("PayrollTemplate", payrollTemplateSchema)

export default PayrollTemplate
export type PayrollTemplateType = InferSchemaType<typeof payrollTemplateSchema>
export type PayrollTemplateDocument = Document & PayrollTemplateType
export type PayrollTemplateModel = Model<PayrollTemplateDocument>
