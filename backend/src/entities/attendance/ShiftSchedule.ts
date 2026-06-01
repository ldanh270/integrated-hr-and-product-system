import mongoose, { Document, InferSchemaType, Model } from "mongoose"

/**
 * ShiftSchedule Entity
 *
 * Represents an employee's weekly work pattern. It maps each day of the week
 * (mon-sun) to a specific WorkingShift template or null (if it's a day off).
 *
 * This acts as the "source of truth" to auto-generate daily `EmployeeShift`
 * records for the employee over a given validity period (`validFrom` to `validTo`).
 */
const shiftScheduleSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    weekdays: {
      mon: { type: mongoose.Schema.Types.ObjectId, ref: "WorkingShift", default: null },
      tue: { type: mongoose.Schema.Types.ObjectId, ref: "WorkingShift", default: null },
      wed: { type: mongoose.Schema.Types.ObjectId, ref: "WorkingShift", default: null },
      thu: { type: mongoose.Schema.Types.ObjectId, ref: "WorkingShift", default: null },
      fri: { type: mongoose.Schema.Types.ObjectId, ref: "WorkingShift", default: null },
      sat: { type: mongoose.Schema.Types.ObjectId, ref: "WorkingShift", default: null },
      sun: { type: mongoose.Schema.Types.ObjectId, ref: "WorkingShift", default: null },
    },

    validFrom: {
      type: Date,
      required: true,
      set: (value: Date) => {
        const date = new Date(value)
        date.setHours(0, 0, 0, 0)
        return date
      },
    },

    validTo: {
      type: Date,
      default: null,
      set: (value: Date | null) => {
        if (!value) return null
        const date = new Date(value)
        date.setHours(0, 0, 0, 0)
        return date
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true },
)

// Indexes
shiftScheduleSchema.index({ employeeId: 1, validFrom: -1 })
shiftScheduleSchema.index({ validTo: 1 })

export type ShiftScheduleType = InferSchemaType<typeof shiftScheduleSchema>
export type ShiftScheduleDocument = Document & ShiftScheduleType
export type ShiftScheduleModel = Model<ShiftScheduleDocument>

// Pre-validate hook
shiftScheduleSchema.pre("validate", function (this: any) {
  if (this.validFrom && this.validTo && this.validFrom >= this.validTo) {
    this.invalidate("validTo", "validTo must be after validFrom")
  }

  // Validate at least one weekday must have a working shift assigned
  const wk = this.weekdays
  if (wk && !wk.mon && !wk.tue && !wk.wed && !wk.thu && !wk.fri && !wk.sat && !wk.sun) {
    this.invalidate("weekdays", "At least one weekday must have a shift assigned")
  }
})

const ShiftSchedule = mongoose.model("ShiftSchedule", shiftScheduleSchema)

export default ShiftSchedule
