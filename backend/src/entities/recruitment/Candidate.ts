import { CANDIDATE_SOURCES, CANDIDATE_STATUSES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const candidateSchema = new mongoose.Schema(
  {
    postingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecruitmentPosting",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    source: {
      type: String,
      enum: CANDIDATE_SOURCES,
      default: "website",
      required: true,
    },

    cvUrl: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: CANDIDATE_STATUSES,
      default: "new",
      required: true,
    },

    note: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null, // null if candidate self-applied via public form
    },
  },
  { timestamps: true },
)

candidateSchema.index({ postingId: 1, status: 1 })
candidateSchema.index({ email: 1 }) // Quick lookup by email
candidateSchema.index({ postingId: 1, email: 1 }, { unique: true }) // Prevent duplicate applications for the same posting
// Sparse index: createdBy may be null for self-applied candidates
candidateSchema.index({ createdBy: 1 }, { sparse: true })

const Candidate = mongoose.model("Candidate", candidateSchema)

export default Candidate
export type CandidateType = InferSchemaType<typeof candidateSchema>
export type CandidateDocument = Document & CandidateType
export type CandidateModel = Model<CandidateDocument>
