import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const employeeShiftSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkingShift",
      required: true,
    },

    assignedDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
)

// Compound unique: một nhân viên chỉ được assign 1 ca mỗi ngày
employeeShiftSchema.index({ employeeId: 1, assignedDate: 1 }, { unique: true })
employeeShiftSchema.index({ shiftId: 1, assignedDate: 1 }) // Query ca theo ngày

export const EmployeeShift = mongoose.model("EmployeeShift", employeeShiftSchema)
export type EmployeeShiftType = InferSchemaType<typeof employeeShiftSchema>
export type EmployeeShiftDocument = Document & EmployeeShiftType
export type EmployeeShiftModel = Model<EmployeeShiftDocument>
