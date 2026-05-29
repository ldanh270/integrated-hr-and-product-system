import mongoose, { InferSchemaType } from "mongoose"

const ACTION_TYPES = ["login", "logout", "failed-login"] as const

const activityLogSchema = new mongoose.Schema(
  {
    empId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false, // May be null if login fails for unknown user
    },
    actionType: {
      type: String,
      enum: ACTION_TYPES,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    details: {
      type: String, // Optional additional info
    },
  },
  {
    timestamps: true,
  },
)

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema)

export default ActivityLog

export type ActivityLogType = InferSchemaType<typeof activityLogSchema>
