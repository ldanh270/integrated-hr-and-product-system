import { SHIFT_REPEAT_TYPES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

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

    // GPS geofencing cho check-in
    gps: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      radiusMeters: { type: Number, min: 0, default: 100 },
    },

    repeatType: {
      type: String,
      enum: SHIFT_REPEAT_TYPES,
      default: "daily",
      required: true,
    },

    // Ngày hiệu lực
    applyFrom: { type: Date },
    applyTo: { type: Date },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true },
)

workingShiftSchema.index({ repeatType: 1, applyFrom: 1, applyTo: 1 })

const WorkingShift = mongoose.model("WorkingShift", workingShiftSchema)

export default WorkingShift
export type WorkingShiftType = InferSchemaType<typeof workingShiftSchema>
export type WorkingShiftDocument = Document & WorkingShiftType
export type WorkingShiftModel = Model<WorkingShiftDocument>
