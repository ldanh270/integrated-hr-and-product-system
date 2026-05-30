import mongoose, { Document, InferSchemaType, Model } from "mongoose"

/**
 * WorkingShift Entity
 *
 * Represents a reusable shift template. It defines the core rules for a shift:
 * - Start and end times ("HH:mm").
 * - Allowed grace period for late arrivals.
 * - GPS geofencing requirements for check-ins.
 *
 * Note: This is purely a template. It does not contain any information about
 * dates, repeat patterns, or which employee is assigned to it.
 * To assign a shift to an employee, see the `ShiftSchedule` entity.
 */
const workingShiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Lưu dạng "HH:mm" — dùng String thay vì Date để tránh timezone hell.
    // Khi so sánh, parse thành minutes-from-midnight.
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/, // Validate "HH:mm"
    },

    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    // Số phút cho phép trễ trước khi tính late
    gracePeriodMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 60,
    },

    // GPS geofencing cho check-in
    gps: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      radiusMeters: { type: Number, min: 0, default: 100 },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true },
)

workingShiftSchema.index({ isActive: 1 })

export type WorkingShiftType = InferSchemaType<typeof workingShiftSchema>
export type WorkingShiftDocument = Document & WorkingShiftType
export type WorkingShiftModel = Model<WorkingShiftDocument>

// Pre-validate: startTime < endTime (minutes from midnight comparison)
workingShiftSchema.pre("validate", function (this: any) {
  if (this.startTime && this.endTime) {
    const parseHHMM = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number)
      return h * 60 + m
    }
    const start = parseHHMM(this.startTime)
    const end = parseHHMM(this.endTime)
    if (start >= end) {
      this.invalidate("endTime", "endTime must be after startTime")
    }
  }
})

const WorkingShift = mongoose.model("WorkingShift", workingShiftSchema)

export default WorkingShift
