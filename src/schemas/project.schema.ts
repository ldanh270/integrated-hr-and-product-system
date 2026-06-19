import { z } from "zod";

// ─── Projects ────────────────────────────────────────────────────────────────
const ProjectStatusEnum = z.enum(["planning", "active", "on_hold", "completed", "cancelled"]);
const TaskCreationPolicyEnum = z.enum(["leader_only", "all_members"]);

export const CreateProjectSchema = z.object({
	name: z.string().min(2).max(100),
	description: z.string().max(500).optional(),
	techStack: z.array(z.string()).min(1),
	status: ProjectStatusEnum.optional(),
	taskCreationPolicy: TaskCreationPolicyEnum.optional(),
	startDate: z.string().datetime().optional(),
	expectedEndDate: z.string().datetime().optional(),
	teamLeaderId: z.string().optional(),
});

export const UpdateProjectSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	description: z.string().max(500).optional(),
	techStack: z.array(z.string()).min(1).optional(),
	status: ProjectStatusEnum.optional(),
	taskCreationPolicy: TaskCreationPolicyEnum.optional(),
	startDate: z.string().datetime().optional(),
	expectedEndDate: z.string().datetime().optional(),
	actualEndDate: z.string().datetime().nullable().optional(),
	teamLeaderId: z.string().nullable().optional(),
});

export const ListProjectsSchema = z.object({
	page: z.number().int().positive().optional(),
	limit: z.number().int().positive().optional(),
	search: z.string().optional(),
	status: ProjectStatusEnum.optional(),
	sortBy: z.string().optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
const TaskTrackerEnum = z.enum(["bug", "feature", "support"]);
const TaskStatusEnum = z.enum([
	"todo",
	"in_progress",
	"in_review",
	"done",
	"cancelled",
	"reopened",
]);
const TaskPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const CreateTaskSchema = z.object({
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
});

export const UpdateTaskSchema = z.object({
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
});

export const ListTasksSchema = z.object({
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
});

// ─── Spent Times ──────────────────────────────────────────────────────────────
const ActivityEnum = z.enum([
	"design",
	"development",
	"testing",
	"documentation",
	"management",
	"other",
]);
const WorkTimeTypeEnum = z.enum(["working_day", "overtime", "weekend", "holiday"]);

export const LogSpentTimeSchema = z.object({
	taskId: z.string(),
	date: z.string().datetime(),
	hours: z.number().min(0.01).max(24),
	activity: ActivityEnum,
	employeeId: z.string().optional(),
	comment: z.string().max(255).optional(),
	workTimeType: WorkTimeTypeEnum.optional(),
});

export const UpdateSpentTimeSchema = z.object({
	date: z.string().datetime().optional(),
	hours: z.number().min(0.01).max(24).optional(),
	comment: z.string().max(255).nullable().optional(),
	activity: ActivityEnum.optional(),
	workTimeType: WorkTimeTypeEnum.optional(),
});

export const ListSpentTimesSchema = z.object({
	taskId: z.string().optional(),
	employeeId: z.string().optional(),
	projectId: z.string().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ListProjectsInput = z.infer<typeof ListProjectsSchema>;

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type ListTasksInput = z.infer<typeof ListTasksSchema>;

export type LogSpentTimeInput = z.infer<typeof LogSpentTimeSchema>;
export type UpdateSpentTimeInput = z.infer<typeof UpdateSpentTimeSchema>;
export type ListSpentTimesInput = z.infer<typeof ListSpentTimesSchema>;
