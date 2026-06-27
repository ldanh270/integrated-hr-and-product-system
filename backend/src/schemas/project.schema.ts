import { PROJECT_STATUSES, TASK_CREATION_POLICIES, PROJECT_MEMBER_WORK_MODES } from "@/configs/entities/project.config.ts"

import { z } from "zod"

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name too long")
      .trim(),

    description: z.string().max(500, "Description too long").trim().optional().nullable(),

    techStack: z.array(z.string()).min(1, "Tech stack must contain at least one technology"),

    status: z.enum(PROJECT_STATUSES).optional(),

    taskCreationPolicy: z.enum(TASK_CREATION_POLICIES).optional(),

    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" })
      .optional()
      .nullable(),

    expectedEndDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid expectedEndDate format" })
      .optional()
      .nullable(),

    teamLeaderId: z.string().optional().nullable(),
  })
  .strict()

export type CreateProjectSchemaType = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name too long")
      .trim()
      .optional(),

    description: z.string().max(500, "Description too long").trim().optional().nullable(),

    techStack: z.array(z.string()).min(1).optional(),

    status: z.enum(PROJECT_STATUSES).optional(),

    taskCreationPolicy: z.enum(TASK_CREATION_POLICIES).optional(),

    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" })
      .optional()
      .nullable(),

    expectedEndDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid expectedEndDate format" })
      .optional()
      .nullable(),

    actualEndDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid actualEndDate format" })
      .optional()
      .nullable(),

    teamLeaderId: z.string().optional().nullable(),
  })
  .strict()

export type UpdateProjectSchemaType = z.infer<typeof updateProjectSchema>

export const listProjectsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ListProjectsQuerySchemaType = z.infer<typeof listProjectsQuerySchema>

/** POST member — hourlyRate required for PT payroll; workMode toggles onsite GPS check-in. */
export const addProjectMemberSchema = z
  .object({
    employeeId: z.string().min(1, "Employee ID is required"),
    hourlyRate: z.number().positive("Hourly rate must be positive").optional().nullable(),
    workMode: z.enum(PROJECT_MEMBER_WORK_MODES).optional(),
  })
  .strict()

export type AddProjectMemberSchemaType = z.infer<typeof addProjectMemberSchema>

/** PATCH body — at least one of hourlyRate / workMode required. */
export const updateProjectMemberSchema = z
  .object({
    hourlyRate: z.number().positive("Hourly rate must be positive").optional().nullable(),
    workMode: z.enum(PROJECT_MEMBER_WORK_MODES).optional(),
  })
  .strict()
  .refine((data) => data.hourlyRate !== undefined || data.workMode !== undefined, {
    message: "At least one field must be provided",
  })

export type UpdateProjectMemberSchemaType = z.infer<typeof updateProjectMemberSchema>
