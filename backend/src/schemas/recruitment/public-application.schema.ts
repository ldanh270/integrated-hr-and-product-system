import { z } from "zod";
import { CANDIDATE_SOURCE_VALUES } from "../../configs/entities/recruitment.config";

export const SubmitPublicApplicationSchema = z.object({
  requisitionId: z.string().cuid("Invalid requisitionId"),
  source: z.enum(CANDIDATE_SOURCE_VALUES),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  resumeUrl: z.string().url("Invalid resume URL").optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional(),
  notes: z.string().optional(),
});
