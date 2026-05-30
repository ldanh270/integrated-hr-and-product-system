import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const payrollSettingsSchema = new mongoose.Schema(
  {
    // Ngày trigger tính lương trong tháng (1-28)
    // Dùng max 28 để tránh issue với tháng 2
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
    // Dùng upsert với filter {} để đảm bảo chỉ có 1 document
  },
)

const PayrollSettings = mongoose.model("PayrollSettings", payrollSettingsSchema)

export default PayrollSettings
export type PayrollSettingsType = InferSchemaType<typeof payrollSettingsSchema>
export type PayrollSettingsDocument = Document & PayrollSettingsType
export type PayrollSettingsModel = Model<PayrollSettingsDocument>
