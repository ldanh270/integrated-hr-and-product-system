import { z } from "zod";
import { CANDIDATE_SOURCE_VALUES } from "../../configs/entities/recruitment.config";

export const CreateJobPostingSchema = z.object({
  requisitionId: z.string().cuid("Invalid requisition ID"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().min(1, "Requirements are required"),
  benefits: z.string().optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
}).refine(data => {
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMax >= data.salaryMin;
  }
  return true;
}, {
  message: "salaryMax must be greater than or equal to salaryMin",
  path: ["salaryMax"],
});

export const PublishChannelSchema = z.object({
  source: z.enum(CANDIDATE_SOURCE_VALUES),
  url: z.string().url("Must be a valid URL").optional(),
});
