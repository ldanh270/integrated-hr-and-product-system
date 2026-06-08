import { TASK_PRIORITIES, TASK_STATUSES } from "@/configs/entities/project.config.ts"

export type TaskPriority = (typeof TASK_PRIORITIES)[number]
export type TaskStatus = (typeof TASK_STATUSES)[number]

export interface Task {
  id: string
  projectId: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  assigneeId: string | null
  createdById: string
  dueDate: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  project?: {
    id: string
    name: string
    taskCreationPolicy: string
    teamLeaderId: string | null
  }
  assignee?: {
    id: string
    fullName: string
    email: string
  } | null
  createdBy?: {
    id: string
    fullName: string
    email: string
  }
}

export interface CreateTaskDto {
  projectId: string
  title: string
  description?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  assigneeId?: string | null
  dueDate?: Date | string | null
}

export interface UpdateTaskDto {
  title?: string
  description?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  assigneeId?: string | null
  dueDate?: Date | string | null
  completedAt?: Date | string | null
}

export interface TaskListQuery {
  projectId?: string
  page?: number
  limit?: number
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedTasksDto {
  data: Task[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>
  listTasks(query: TaskListQuery): Promise<PaginatedTasksDto>
  createTask(data: CreateTaskDto & { createdById: string }): Promise<Task>
  updateTask(id: string, data: UpdateTaskDto): Promise<Task | null>
  deleteTask(id: string): Promise<boolean>
}

export interface ITaskService {
  getTask(id: string, userId: string, userRole: string): Promise<Task | null>
  listTasks(query: TaskListQuery, userId: string, userRole: string): Promise<PaginatedTasksDto>
  createTask(data: CreateTaskDto, userId: string, userRole: string): Promise<Task>
  updateTask(
    id: string,
    data: UpdateTaskDto,
    userId: string,
    userRole: string,
  ): Promise<Task | null>
  deleteTask(id: string, userId: string, userRole: string): Promise<boolean>
}
