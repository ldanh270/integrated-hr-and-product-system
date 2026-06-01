import { PROPOSAL_STATUSES } from "@/configs/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const recruitmentProposalSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    position: {
      type: String,
      required: true,
      trim: true,
    },

    headcount: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      trim: true,
    },

    expectedStart: {
      type: Date,
    },

    status: {
      type: String,
      enum: PROPOSAL_STATUSES,
      default: "pending",
      required: true,
    },

    // ── Closure info ──────────────────────────────────────────
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    closedReason: {
      type: String,
      trim: true,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    // ── Approval audit ────────────────────────────────────────
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

recruitmentProposalSchema.index({ status: 1, createdAt: -1 })
recruitmentProposalSchema.index({ requestedBy: 1 })

const RecruitmentProposal = mongoose.model("RecruitmentProposal", recruitmentProposalSchema)

export default RecruitmentProposal
export type RecruitmentProposalType = InferSchemaType<typeof recruitmentProposalSchema>
export type RecruitmentProposalDocument = Document & RecruitmentProposalType
export type RecruitmentProposalModel = Model<RecruitmentProposalDocument>
