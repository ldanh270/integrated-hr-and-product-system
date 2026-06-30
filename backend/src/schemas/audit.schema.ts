import { z } from "zod"

/**
 * Validates and normalizes query parameters for audit log listing endpoints.
 */
export const listAuditQuerySchema = z.object({
  // Coerces page query values to positive integers when provided.
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1)).optional(),
  // Coerces limit query values to bounded positive integers when provided.
  limit: z
    .preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).max(100))
    .optional(),
  actorId: z.string().optional(),
  targetEmployeeId: z.string().optional(),
  targetRoleId: z.string().optional(),
  action: z.string().optional(),
  category: z.string().optional(),
})

export type ListAuditQuerySchemaType = z.infer<typeof listAuditQuerySchema>
