import { z } from "zod"

import {
  PROJECT_STATUSES,
  SPENT_TIME_ACTIVITIES,
  SPENT_TIME_WORK_TIME_TYPES,
  TASK_CREATION_POLICIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TRACKERS,
} from "../constants/entities/project.config.js"

// ─── Projects ────────────────────────────────────────────────────────────────
const ProjectStatusEnum = z.enum(PROJECT_STATUSES)
const TaskCreationPolicyEnum = z.enum(TASK_CREATION_POLICIES)

export const CreateProjectSchema = z
  .object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    techStack: z.array(z.string()).min(1),
    status: ProjectStatusEnum.optional(),
    taskCreationPolicy: TaskCreationPolicyEnum.optional(),
    startDate: z.string().datetime().optional(),
    expectedEndDate: z.string().datetime().optional(),
    teamLeaderId: z.string().optional(),
  })
  .strict()

export const UpdateProjectSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    techStack: z.array(z.string()).min(1).optional(),
    status: ProjectStatusEnum.optional(),
    taskCreationPolicy: TaskCreationPolicyEnum.optional(),
    startDate: z.string().datetime().optional(),
    expectedEndDate: z.string().datetime().optional(),
    actualEndDate: z.string().datetime().nullable().optional(),
    teamLeaderId: z.string().nullable().optional(),
  })
  .strict()

export const ListProjectsSchema = z
  .object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    search: z.string().optional(),
    status: ProjectStatusEnum.optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .strict()

// ─── Tasks ────────────────────────────────────────────────────────────────────
const TaskTrackerEnum = z.enum(TASK_TRACKERS)
const TaskStatusEnum = z.enum(TASK_STATUSES)
const TaskPriorityEnum = z.enum(TASK_PRIORITIES)

export const CreateTaskSchema = z
  .object({
    projectId: z.string(),
    title: z.string().min(2).max(150),
    description: z.string().max(1000).optional(),
    tracker: TaskTrackerEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    status: TaskStatusEnum.optional(),
    assigneeId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    estimatedTime: z.number().nonnegative().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    categoryId: z.string().optional(),
  })
  .strict()

export const UpdateTaskSchema = z
  .object({
    title: z.string().min(2).max(150).optional(),
    description: z.string().max(1000).optional(),
    tracker: TaskTrackerEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    status: TaskStatusEnum.optional(),
    assigneeId: z.string().nullable().optional(),
    startDate: z.string().datetime().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    completedAt: z.string().datetime().nullable().optional(),
    estimatedTime: z.number().nonnegative().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    categoryId: z.string().nullable().optional(),
  })
  .strict()

export const ListTasksSchema = z
  .object({
    projectId: z.string().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    search: z.string().optional(),
    tracker: TaskTrackerEnum.optional(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    assigneeId: z.string().optional(),
    createdById: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .strict()

// ─── Spent Times ──────────────────────────────────────────────────────────────
const ActivityEnum = z.enum(SPENT_TIME_ACTIVITIES)
const WorkTimeTypeEnum = z.enum(SPENT_TIME_WORK_TIME_TYPES)

export const LogSpentTimeSchema = z
  .object({
    taskId: z.string(),
    date: z.string().datetime(),
    hours: z.number().min(0.01).max(24),
    activity: ActivityEnum,
    employeeId: z.string().optional(),
    comment: z.string().max(255).optional(),
    workTimeType: WorkTimeTypeEnum.optional(),
  })
  .strict()

export const UpdateSpentTimeSchema = z
  .object({
    date: z.string().datetime().optional(),
    hours: z.number().min(0.01).max(24).optional(),
    comment: z.string().max(255).nullable().optional(),
    activity: ActivityEnum.optional(),
    workTimeType: WorkTimeTypeEnum.optional(),
  })
  .strict()

export const ListSpentTimesSchema = z
  .object({
    taskId: z.string().optional(),
    employeeId: z.string().optional(),
    projectId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .strict()

// ─── Inferred types ───────────────────────────────────────────────────────────
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type ListProjectsInput = z.infer<typeof ListProjectsSchema>

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type ListTasksInput = z.infer<typeof ListTasksSchema>

export type LogSpentTimeInput = z.infer<typeof LogSpentTimeSchema>
export type UpdateSpentTimeInput = z.infer<typeof UpdateSpentTimeSchema>
export type ListSpentTimesInput = z.infer<typeof ListSpentTimesSchema>
