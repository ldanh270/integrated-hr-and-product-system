import { z } from "zod"

export const createPayslipTemplateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z.string().optional(),
  components: z
    .array(
      z.object({
        componentId: z.string().min(1, "Component is required"),
        overrideFormula: z.string().optional(),
      }),
    )
    .min(1, "At least one salary component is required"),
})

export type CreatePayslipTemplateFormData = z.infer<typeof createPayslipTemplateSchema>
