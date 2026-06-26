import { z } from "zod"

export const listAuditQuerySchema = z.object({
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1)).optional(),
  limit: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).max(100)).optional(),
  actorId: z.string().optional(),
  targetEmployeeId: z.string().optional(),
  targetRoleId: z.string().optional(),
  action: z.string().optional(),
  category: z.string().optional(),
})

export type ListAuditQuerySchemaType = z.infer<typeof listAuditQuerySchema>
