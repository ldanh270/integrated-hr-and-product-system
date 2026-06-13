import { TASK_PRIORITIES, TASK_STATUSES, TASK_TRACKERS } from "@/configs/entities/project.config.ts"

import { z } from "zod"

export const createTaskSchema = z
  .object({
    projectId: z.string().min(1, "Project ID is required"),
    title: z
      .string()
      .min(2, "Task title must be at least 2 characters")
      .max(150, "Task title too long")
      .trim(),

    description: z.string().max(1000, "Description too long").trim().optional().nullable(),

    tracker: z.enum(TASK_TRACKERS).optional(),

    priority: z.enum(TASK_PRIORITIES).optional(),

    status: z.enum(TASK_STATUSES).optional(),

    assigneeId: z.string().optional().nullable(),

    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" })
      .optional()
      .nullable(),

    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid dueDate format" })
      .optional()
      .nullable(),

    estimatedTime: z.number().nonnegative().optional().nullable(),
    progress: z.number().int().min(0).max(100).optional(),
  })
  .strict()

export type CreateTaskSchemaType = z.infer<typeof createTaskSchema>

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .min(2, "Task title must be at least 2 characters")
      .max(150, "Task title too long")
      .trim()
      .optional(),

    description: z.string().max(1000, "Description too long").trim().optional().nullable(),

    tracker: z.enum(TASK_TRACKERS).optional(),

    priority: z.enum(TASK_PRIORITIES).optional(),

    status: z.enum(TASK_STATUSES).optional(),

    assigneeId: z.string().optional().nullable(),

    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" })
      .optional()
      .nullable(),

    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid dueDate format" })
      .optional()
      .nullable(),

    completedAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid completedAt format" })
      .optional()
      .nullable(),

    estimatedTime: z.number().nonnegative().optional().nullable(),
    progress: z.number().int().min(0).max(100).optional(),
  })
  .strict()

export type UpdateTaskSchemaType = z.infer<typeof updateTaskSchema>

export const listTasksQuerySchema = z.object({
  projectId: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  tracker: z.enum(TASK_TRACKERS).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: z.string().optional(),
  createdById: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ListTasksQuerySchemaType = z.infer<typeof listTasksQuerySchema>
