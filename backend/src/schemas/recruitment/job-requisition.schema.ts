import { z } from "zod";
import { JOB_FAMILY_VALUES, JOB_LEVEL_VALUES } from "../../configs/entities/recruitment.config";

export const CreateJobRequisitionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  departmentName: z.string().min(1, "Department name is required"),
  headcountNeeded: z.number().int().positive("Headcount must be positive"),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  jobFamily: z.enum(JOB_FAMILY_VALUES).optional(),
  level: z.enum(JOB_LEVEL_VALUES).optional(),
  targetStartDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
}).refine(data => {
  if (data.budgetMin && data.budgetMax) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"],
});

export const RejectJobRequisitionSchema = z.object({
  reason: z.string().min(1, "Reject reason is required"),
});
