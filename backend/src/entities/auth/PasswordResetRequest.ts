import { PASSWORD_RESET_STATUSES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const passwordResetRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      select: false, // Token nhạy cảm — không trả về mặc định
    },

    status: {
      type: String,
      enum: PASSWORD_RESET_STATUSES,
      default: "pending",
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    note: {
      type: String,
      trim: true,
    },

    modifiedAt: {
      type: Date,
      default: null,
    },

    // TTL field: document tự xóa sau 7 ngày kể từ createdAt
    // MongoDB TTL index sẽ dùng field này
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
    },
  },
  {
    timestamps: true,
  },
)

// ─── Indexes ──────────────────────────────────────────────────────────────────
passwordResetRequestSchema.index({ employeeId: 1, status: 1 })

// TTL index: MongoDB tự động xóa document khi expiresAt < now
// Chạy background job mỗi 60 giây
passwordResetRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// ─── Model ────────────────────────────────────────────────────────────────────
const PasswordResetRequest = mongoose.model("PasswordResetRequest", passwordResetRequestSchema)
export default PasswordResetRequest

export type PasswordResetRequestType = InferSchemaType<typeof passwordResetRequestSchema>
export type PasswordResetRequestDocument = Document & PasswordResetRequestType
export type PasswordResetRequestModel = Model<PasswordResetRequestDocument>
