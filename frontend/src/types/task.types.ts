import { TASK_PRIORITIES, TASK_STATUSES, TASK_TRACKERS } from "@/config/entities/project.config"

export type TaskTracker = (typeof TASK_TRACKERS)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]
export type TaskStatus = (typeof TASK_STATUSES)[number]

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
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  estimatedTime: number | null
  progress: number
  resultUrl?: string | null
  resultNotes?: string | null
  rejectionReason?: string | null
  parentTaskId?: string | null
  createdAt: string
  updatedAt: string
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
  tracker?: TaskTracker
  priority?: TaskPriority
  status?: TaskStatus
  assigneeId?: string | null
  startDate?: string | null
  dueDate?: string | null
  estimatedTime?: number | null
  progress?: number
  parentTaskId?: string | null
}

export interface UpdateTaskDto {
  title?: string
  description?: string | null
  tracker?: TaskTracker
  priority?: TaskPriority
  status?: TaskStatus
  assigneeId?: string | null
  startDate?: string | null
  dueDate?: string | null
  completedAt?: string | null
  estimatedTime?: number | null
  progress?: number
  resultUrl?: string | null
  resultNotes?: string | null
  rejectionReason?: string | null
  parentTaskId?: string | null
}

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

export interface PaginatedTasksDto {
  data: Task[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
