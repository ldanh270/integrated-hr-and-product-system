import { z } from "zod";
import { INTERVIEW_FORMAT_VALUES, INTERVIEW_RESULT_VALUES } from "../../configs/entities/recruitment.config";
import { INTERVIEW_RESULT } from "@/configs/entities/recruitment.config";


export const CreateInterviewRoundSchema = z.object({
  applicationId: z.string().cuid("Invalid application ID"),
  roundNumber: z.number().int().positive(),
  title: z.string().min(1, "Title is required"),
  format: z.enum(INTERVIEW_FORMAT_VALUES).optional(),
  scheduledAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  interviewerIds: z.array(z.string().cuid()).min(1, "At least one interviewer is required"),
});

export const SubmitScorecardSchema = z.object({
  roundId: z.string().cuid("Invalid round ID"),
  scores: z.record(z.string(), z.any()),
  verdict: z.enum(INTERVIEW_RESULT_VALUES),
  note: z.string().optional(),
});
