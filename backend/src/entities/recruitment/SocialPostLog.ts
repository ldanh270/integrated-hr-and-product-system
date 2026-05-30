import { SOCIAL_PLATFORMS } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const socialPostLogSchema = new mongoose.Schema(
  {
    postingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecruitmentPosting",
      required: true,
    },

    platform: {
      type: String,
      enum: SOCIAL_PLATFORMS,
      required: true,
    },

    postUrl: {
      type: String,
      trim: true,
    },

    postedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  {
    timestamps: true,
    // Logs are insert-only, no updates required
  },
)

socialPostLogSchema.index({ postingId: 1, platform: 1 })

const SocialPostLog = mongoose.model("SocialPostLog", socialPostLogSchema)

export default SocialPostLog
export type SocialPostLogType = InferSchemaType<typeof socialPostLogSchema>
export type SocialPostLogDocument = Document & SocialPostLogType
export type SocialPostLogModel = Model<SocialPostLogDocument>
