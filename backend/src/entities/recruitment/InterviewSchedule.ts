import {
  INTERVIEW_FORMATS,
  INTERVIEW_RESULTS,
  INTERVIEW_STATUSES,
} from "@/configs/entities/recruitment.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const interviewScheduleSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    format: {
      type: String,
      enum: INTERVIEW_FORMATS,
      required: true,
    },

    // Location (in-person) or meeting link (video_call/phone)
    locationOrLink: {
      type: String,
      trim: true,
    },

    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: INTERVIEW_STATUSES[0],
      required: true,
    },

    // ── Post-interview fields ─────────────────────────────────
    result: {
      type: String,
      enum: INTERVIEW_RESULTS,
      default: INTERVIEW_RESULTS[2],
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    feedback: {
      type: String,
      trim: true,
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true },
)

interviewScheduleSchema.index({ candidateId: 1, scheduledAt: -1 })
interviewScheduleSchema.index({ interviewerId: 1, scheduledAt: -1 }) // Interviewer's schedule
interviewScheduleSchema.index({ status: 1, scheduledAt: 1 }) // Reminder job

const InterviewSchedule = mongoose.model("InterviewSchedule", interviewScheduleSchema)

export default InterviewSchedule
export type InterviewScheduleType = InferSchemaType<typeof interviewScheduleSchema>
export type InterviewScheduleDocument = Document & InterviewScheduleType
export type InterviewScheduleModel = Model<InterviewScheduleDocument>
