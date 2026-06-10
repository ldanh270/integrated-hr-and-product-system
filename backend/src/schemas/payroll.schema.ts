import { z } from "zod"

export const assignSalaryConfigSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  baseSalary: z.number().min(0, "Base salary must be non-negative"),
  effectiveFrom: z.coerce.date(),
  note: z.string().optional(),
})

export type AssignSalaryConfigSchemaType = z.infer<typeof assignSalaryConfigSchema>
