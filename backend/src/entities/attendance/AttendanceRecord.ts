import { ATTENDANCE_STATUSES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const attendanceRecordSchema = new mongoose.Schema(
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

    // Thời điểm chấm công thực tế (event time) — lưu UTC
    fingerprintAt: {
      type: Date,
      required: true,
    },

    // GPS tại thời điểm chấm công — có thể null nếu chấm bằng fingerprint reader
    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },

    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },

    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

// Query chấm công theo nhân viên trong khoảng thời gian (tính lương, report)
attendanceRecordSchema.index({ employeeId: 1, fingerprintAt: -1 })
attendanceRecordSchema.index({ shiftId: 1, fingerprintAt: -1 })

// Partial index: tìm nhanh các record bất thường
attendanceRecordSchema.index(
  { status: 1, fingerprintAt: -1 },
  { partialFilterExpression: { status: { $in: ["late", "absent", "early_leave"] } } },
)

export const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema)
export type AttendanceRecordType = InferSchemaType<typeof attendanceRecordSchema>
export type AttendanceRecordDocument = Document & AttendanceRecordType
export type AttendanceRecordModel = Model<AttendanceRecordDocument>
