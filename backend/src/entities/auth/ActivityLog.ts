import mongoose, { InferSchemaType } from "mongoose"

const ACTION_TYPES = ["login", "logout", "failed-login"] as const

const activityLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false, // May be null if login fails for unknown user
    },
    actionType: {
      type: String,
      enum: ACTION_TYPES,
      required: true,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Structured JSON log metadata
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Auto-delete logs after 90 days
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexing for performance and data lifecycle
activityLogSchema.index({ employeeId: 1, createdAt: -1 })
activityLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema)

export default ActivityLog

export type ActivityLogType = InferSchemaType<typeof activityLogSchema>
