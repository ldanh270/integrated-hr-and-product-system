import { APPLICATION_STATUSES, APPLICATION_TYPES, REGIME_TYPES } from "@/configs/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

/**
 * Application Entity
 *
 * Central entity for all employee requests (Leaves, Overtime, Shift Swap, etc.).
 *
 * - For "shift_swap", `swapWith` maps to a specific `EmployeeShift` record (employeeShiftId),
 *   allowing employees to swap shifts on a specific day.
 * - Managed by HR/Admin who can approve or reject the application.
 */
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

    // ── Shift/Operational Mapping ──────────────────────────────
    // Gắn trực tiếp vào ca làm việc cụ thể (nếu đã generate)
    employeeShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeShift",
      default: null,
    },

    // Gắn vào loại ca (Template)
    workingShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkingShift",
      default: null,
    },

    // ── Shift swap specific ───────────────────────────────────
    // Chỉ có giá trị khi type === "shift_swap"
    swapWith: {
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },
      employeeShiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmployeeShift",
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

export type ApplicationType = InferSchemaType<typeof applicationSchema>

// Validate date range and polymorphic fields based on application type
applicationSchema.pre("validate", function (this: mongoose.HydratedDocument<ApplicationType>) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    this.invalidate("endDate", "endDate must be after startDate")
  }
  if (this.type !== "shift_swap") {
    this.set("swapWith", { employeeId: null, employeeShiftId: null })
  } else {
    if (!this.swapWith || !this.swapWith.employeeId || !this.swapWith.employeeShiftId) {
      this.invalidate(
        "swapWith",
        "swapWith employeeId and employeeShiftId are required for shift_swap type",
      )
    }
  }
})

applicationSchema.index({ employeeId: 1, status: 1 })
applicationSchema.index({ employeeId: 1, startDate: -1 })
applicationSchema.index({ status: 1, type: 1 }) // HR duyệt đơn theo loại

const Application = mongoose.model("Application", applicationSchema)

export default Application
export type ApplicationDocument = Document & ApplicationType
export type ApplicationModel = Model<ApplicationDocument>
