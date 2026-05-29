import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const templateComponentSubSchema = new mongoose.Schema(
  {
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollComponent",
      required: true,
    },
    // Override giá trị default của component cho template này
    overrideValue: {
      type: Number,
      default: null,
    },
  },
  { _id: false }, // Không cần _id cho embedded array item
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

    // Embed components thay vì collection trung gian — tránh $lookup khi tính lương
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
// Index cho lookup từ Employee.payrollTemplateId
payrollTemplateSchema.index({ _id: 1, isActive: 1 })

export const PayrollTemplate = mongoose.model("PayrollTemplate", payrollTemplateSchema)
export type PayrollTemplateType = InferSchemaType<typeof payrollTemplateSchema>
export type PayrollTemplateDocument = Document & PayrollTemplateType
export type PayrollTemplateModel = Model<PayrollTemplateDocument>
