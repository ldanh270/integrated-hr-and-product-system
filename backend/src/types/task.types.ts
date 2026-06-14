import { TASK_PRIORITIES, TASK_STATUSES, TASK_TRACKERS } from "@/configs/entities/project.config.ts"

/**
 * Type representing the tracker of a Task (e.g., feature, bug, support)
 */
export type TaskTracker = (typeof TASK_TRACKERS)[number]

/**
 * Type representing the priority level of a Task (e.g., low, medium, high)
 */
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

/**
 * Type representing the current status of a Task (e.g., todo, in_progress, review, done)
 */
export type TaskStatus = (typeof TASK_STATUSES)[number]

/**
 * Domain model representing a Task associated with a Project
 */
export interface Task {
  id: string
  projectId: string
  title: string
  description: string | null
  tracker: TaskTracker
  priority: TaskPriority
  status: TaskStatus
  assigneeId: string | null
  createdById: string
  startDate: Date | null
  dueDate: Date | null
  completedAt: Date | null
  estimatedTime: number | null
  progress: number
  categoryId?: string | null
  category?: {
    id: string
    name: string
  } | null
  createdAt: Date
  updatedAt: Date
  /**
   * Parent project information containing the project's task creation policy
   */
  project?: {
    id: string
    name: string
    taskCreationPolicy: string
    teamLeaderId: string | null
  }
  /**
   * The employee assigned to resolve the task
   */
  assignee?: {
    id: string
    fullName: string
    email: string
  } | null
  /**
   * The employee who created the task
   */
  createdBy?: {
    id: string
    fullName: string
    email: string
  }
}

/**
 * Data Transfer Object for creating a new Task
 */
export interface CreateTaskDto {
  projectId: string
  title: string
  description?: string | null
  tracker?: TaskTracker
  priority?: TaskPriority
  status?: TaskStatus
  assigneeId?: string | null
  startDate?: Date | string | null
  dueDate?: Date | string | null
  estimatedTime?: number | null
  progress?: number
  categoryId?: string | null
}

/**
 * Data Transfer Object for updating an existing Task
 */
export interface UpdateTaskDto {
  title?: string
  description?: string | null
  tracker?: TaskTracker
  priority?: TaskPriority
  status?: TaskStatus
  assigneeId?: string | null
  startDate?: Date | string | null
  dueDate?: Date | string | null
  completedAt?: Date | string | null
  estimatedTime?: number | null
  progress?: number
  categoryId?: string | null
}

/**
 * Query parameters for filtering and paginating a list of tasks
 */
export interface TaskListQuery {
  projectId?: string
  page?: number
  limit?: number
  search?: string
  tracker?: TaskTracker
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  createdById?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

/**
 * Standard Paginated Response envelope for Task list requests
 */
export interface PaginatedTasksDto {
  data: Task[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Repository interface for managing Task database transactions
 */
export interface ITaskRepository {
  findById(id: string): Promise<Task | null>
  listTasks(query: TaskListQuery): Promise<PaginatedTasksDto>
  createTask(data: CreateTaskDto & { createdById: string }): Promise<Task>
  updateTask(id: string, data: UpdateTaskDto): Promise<Task | null>
  deleteTask(id: string): Promise<boolean>
}

/**
 * Service interface implementing Task management business logic
 */
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
