import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const payrollSettingsSchema = new mongoose.Schema(
  {
    // Monthly trigger day for payroll calculation (1-28)
    // Capped at 28 to avoid issues with February
    triggerDay: {
      type: Number,
      required: true,
      min: 1,
      max: 28,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Enforce singleton design at the database level
    _singleton: {
      type: String,
      default: "GLOBAL",
      unique: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
    // Use upsert with empty filter {} to ensure only 1 document exists
  },
)

const PayrollSettings = mongoose.model("PayrollSettings", payrollSettingsSchema)

export default PayrollSettings
export type PayrollSettingsType = InferSchemaType<typeof payrollSettingsSchema>
export type PayrollSettingsDocument = Document & PayrollSettingsType
export type PayrollSettingsModel = Model<PayrollSettingsDocument>
