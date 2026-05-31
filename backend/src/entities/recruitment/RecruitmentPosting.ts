import { POSTING_STATUSES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const recruitmentPostingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    requirements: {
      type: String,
      trim: true,
    },

    benefits: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: POSTING_STATUSES,
      default: "draft",
      required: true,
    },

    deadline: {
      type: Date,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true },
)

recruitmentPostingSchema.index({ status: 1, deadline: 1 })
recruitmentPostingSchema.index({ createdBy: 1 })

const RecruitmentPosting = mongoose.model("RecruitmentPosting", recruitmentPostingSchema)

export default RecruitmentPosting
export type RecruitmentPostingType = InferSchemaType<typeof recruitmentPostingSchema>
export type RecruitmentPostingDocument = Document & RecruitmentPostingType
export type RecruitmentPostingModel = Model<RecruitmentPostingDocument>
