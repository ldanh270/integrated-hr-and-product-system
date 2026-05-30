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
      set: (value: Date) => {
        const date = new Date(value)
        date.setHours(0, 0, 0, 0)
        return date
      },
    },
  },
  { timestamps: true },
)

// Compound unique: một nhân viên chỉ được assign 1 ca mỗi ngày
employeeShiftSchema.index({ employeeId: 1, assignedDate: 1 }, { unique: true })
employeeShiftSchema.index({ shiftId: 1, assignedDate: 1 }) // Query ca theo ngày

const EmployeeShift = mongoose.model("EmployeeShift", employeeShiftSchema)

export default EmployeeShift
export type EmployeeShiftType = InferSchemaType<typeof employeeShiftSchema>
export type EmployeeShiftDocument = Document & EmployeeShiftType
export type EmployeeShiftModel = Model<EmployeeShiftDocument>
