import { z } from "zod";
import { JOB_LEVEL_VALUES } from "../../configs/entities/recruitment.config";
import { JOB_LEVEL } from "@/configs/entities/recruitment.config";

export const CreateJobRequisitionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  departmentName: z.string().min(1, "Department name is required"),
  headcountNeeded: z.number().int().positive("Headcount must be positive"),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
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
  note: z.string().min(1, "Reject note is required"),
});

export const ApproveJobRequisitionSchema = z.object({
  note: z.string().optional(),
});
