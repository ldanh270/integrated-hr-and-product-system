import { z } from "zod";
import { CANDIDATE_SOURCE_VALUES, JOB_APPLICATION_STATUS_VALUES } from "../../configs/entities/recruitment.config";

export const ApplyJobSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  resumeUrl: z.string().url("Invalid URL").optional(),
  linkedinUrl: z.string().url("Invalid URL").optional(),
  
  requisitionId: z.string().cuid("Invalid requisition ID"),
  postingId: z.string().cuid("Invalid posting ID").optional(),
  source: z.enum(CANDIDATE_SOURCE_VALUES).optional(),
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(JOB_APPLICATION_STATUS_VALUES),
});

export const RejectApplicationSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export const UpdateKanbanOrderSchema = z.object({
  kanbanOrder: z.number().int().nonnegative("Kanban order must be 0 or positive"),
});
