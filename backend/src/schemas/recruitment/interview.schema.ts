import { z } from "zod";
import { INTERVIEW_FORMAT_VALUES, INTERVIEW_RESULT_VALUES, INTERVIEW_STATUS_VALUES } from "../../configs/entities/recruitment.config";

export const CreateInterviewRoundSchema = z.object({
  requisitionId: z.string().cuid("Invalid requisition ID"),
  roundNumber: z.number().int().min(1, "Round number must be at least 1"),
  title: z.string().min(1, "Title is required"),
  format: z.enum(INTERVIEW_FORMAT_VALUES).optional(),
  scheduledAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  interviewerIds: z.array(z.string().cuid()).min(1, "At least one interviewer is required"),
  applicationIds: z.array(z.string().cuid()).min(1, "At least one application is required"),
});

export const UpdateInterviewRoundSchema = z.object({
  title: z.string().min(1, "Title is required"),
  format: z.enum(INTERVIEW_FORMAT_VALUES),
  scheduledAt: z.string().datetime().transform(val => val ? new Date(val) : undefined),
  status: z.enum(INTERVIEW_STATUS_VALUES),
  leadInterviewerId: z.string().cuid(),
}).partial();

export const SubmitScorecardSchema = z.object({
  roundId: z.string().cuid("Invalid round ID"),
  applicationId: z.string().cuid("Invalid application ID"),
  scores: z.record(z.string(), z.unknown()).optional(),
  verdict: z.enum(INTERVIEW_RESULT_VALUES),
  note: z.string().optional(),
});
