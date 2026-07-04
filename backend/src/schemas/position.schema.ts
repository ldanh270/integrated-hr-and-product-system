import { z } from "zod"
import { TASK_TRACKERS } from "@/configs/entities/project.config.ts"
import { APPLICATION_TYPE_VALUES } from "@/configs/entities/attendance.config.ts"

export const createPositionSchema = z
  .object({
    name: z.string().min(1, "Tên chức vụ không được để trống").max(50, "Tên chức vụ quá dài").trim(),
    code: z.string().min(1, "Mã chức vụ không được để trống").max(50, "Mã chức vụ quá dài").trim(),
    description: z.string().max(200, "Mô tả quá dài").trim().optional(),
    allowedTaskTrackers: z.array(z.string()).optional(),
    allowedApplicationTypes: z.array(z.enum(APPLICATION_TYPE_VALUES as unknown as [string, ...string[]])).optional(),
  })
  .strict()

export type CreatePositionSchemaType = z.infer<typeof createPositionSchema>

export const updatePositionSchema = z
  .object({
    name: z.string().min(1, "Tên chức vụ không được để trống").max(50, "Tên chức vụ quá dài").trim().optional(),
    code: z.string().min(1, "Mã chức vụ không được để trống").max(50, "Mã chức vụ quá dài").trim().optional(),
    description: z.string().max(200, "Mô tả quá dài").trim().nullable().optional(),
    allowedTaskTrackers: z.array(z.string()).optional(),
    allowedApplicationTypes: z.array(z.enum(APPLICATION_TYPE_VALUES as unknown as [string, ...string[]])).optional(),
  })
  .strict()

export type UpdatePositionSchemaType = z.infer<typeof updatePositionSchema>

export const projectPositionRuleDtoSchema = z.object({
  positionId: z.string().min(1, "Position ID is required"),
  allowedTaskTrackers: z.array(z.string()),
  allowedApplicationTypes: z.array(z.enum(APPLICATION_TYPE_VALUES as unknown as [string, ...string[]]))
})

export const saveProjectPositionRulesSchema = z
  .object({
    rules: z.array(projectPositionRuleDtoSchema)
  })
  .strict()

export type SaveProjectPositionRulesSchemaType = z.infer<typeof saveProjectPositionRulesSchema>
