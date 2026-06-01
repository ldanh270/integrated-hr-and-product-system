import { ATTENDANCE_STATUSES } from "@/configs/entities/attendance.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

/**
 * AttendanceRecord Entity
 *
 * Represents the actual time-tracking events for an employee on a specific day.
 * It links to a specific `EmployeeShift` and records the exact time/GPS when
 * the employee checked in and out.
 *
 * - Check-in/out logic is handled automatically: first scan of the day is Check-In,
 *   subsequent scans update the Check-Out time.
 * - This entity stores calculated values (late minutes, early leave, overtime)
 *   for easy consumption by the Payroll module.
 */
const attendanceRecordSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    employeeShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeShift",
      required: true,
      unique: true,
    },

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkingShift",
      required: true,
    },

    date: {
      type: Date,
      required: true,
      set: (value: Date) => {
        const date = new Date(value)
        date.setHours(0, 0, 0, 0)
        return date
      },
    },

    checkIn: {
      at: {
        type: Date,
        default: null,
      },
      location: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 },
      },
    },

    checkOut: {
      at: {
        type: Date,
        default: null,
      },
      location: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 },
      },
    },

    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },

    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    earlyLeaveMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    overtimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWorkMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

// Indexes
attendanceRecordSchema.index({ employeeId: 1, date: -1 })

attendanceRecordSchema.index(
  { status: 1, date: -1 },
  { partialFilterExpression: { status: { $in: ["late", "absent", "early_leave"] } } },
)

const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema)

export default AttendanceRecord
export type AttendanceRecordType = InferSchemaType<typeof attendanceRecordSchema>
export type AttendanceRecordDocument = Document & AttendanceRecordType
export type AttendanceRecordModel = Model<AttendanceRecordDocument>
