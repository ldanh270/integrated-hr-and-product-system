import { z } from "zod";
import { CANDIDATE_SOURCE_VALUES } from "../../configs/entities/recruitment.config";

export const CreateExternalJobPostSchema = z.object({
  source: z.enum(CANDIDATE_SOURCE_VALUES),
  postUrl: z.string().url().optional(),
});

export const UpdateExternalJobPostStatusSchema = z.object({
  isActive: z.boolean(),
});
