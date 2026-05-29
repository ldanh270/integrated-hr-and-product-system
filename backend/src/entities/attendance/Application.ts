import {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  REGIME_TYPES,
} from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const applicationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    type: {
      type: String,
      enum: APPLICATION_TYPES,
      required: true,
    },

    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "pending",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
    },

    note: {
      type: String,
      trim: true,
    },

    regimeType: {
      type: String,
      enum: REGIME_TYPES,
      default: null, // Chỉ áp dụng cho đơn nghỉ phép
    },

    // ── Shift swap specific ───────────────────────────────────
    // Chỉ có giá trị khi type === "shift_swap"
    swapWith: {
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },
      shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkingShift",
        default: null,
      },
    },

    // ── Approval ──────────────────────────────────────────────
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
)

applicationSchema.index({ employeeId: 1, status: 1 })
applicationSchema.index({ employeeId: 1, startDate: -1 })
applicationSchema.index({ status: 1, type: 1 }) // HR duyệt đơn theo loại

export const Application = mongoose.model("Application", applicationSchema)
export type ApplicationType = InferSchemaType<typeof applicationSchema>
export type ApplicationDocument = Document & ApplicationType
export type ApplicationModel = Model<ApplicationDocument>
