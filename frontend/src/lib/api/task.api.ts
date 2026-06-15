import apiClient from "@/lib/api-client"
import type {
  CreateSpentTimeDto,
  SpentTime,
  SpentTimeQuery,
  UpdateSpentTimeDto,
} from "@/types/spent-time.types"
import type { CreateTaskDto, PaginatedTasksDto, Task, TaskListQuery, UpdateTaskDto } from "@/types/task.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const taskApi = {
  list: async (query?: TaskListQuery): Promise<PaginatedTasksDto> => {
    const response = await apiClient.get<ApiResponse<PaginatedTasksDto>>("/tasks", {
      params: query,
    })
    return response.data.data
  },

  getOne: async (id: string): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`)
    return response.data.data
  },

  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>("/tasks", data)
    return response.data.data
  },

  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/tasks/${id}`)
  },

  // Spent Time APIs
  listSpentTimes: async (query?: SpentTimeQuery): Promise<SpentTime[]> => {
    const response = await apiClient.get<ApiResponse<SpentTime[]>>("/spent-times", {
      params: query,
    })
    return response.data.data
  },

  logSpentTime: async (data: CreateSpentTimeDto): Promise<SpentTime> => {
    const response = await apiClient.post<ApiResponse<SpentTime>>("/spent-times", data)
    return response.data.data
  },

  updateSpentTime: async (id: string, data: UpdateSpentTimeDto): Promise<SpentTime> => {
    const response = await apiClient.patch<ApiResponse<SpentTime>>(`/spent-times/${id}`, data)
    return response.data.data
  },

  deleteSpentTime: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/spent-times/${id}`)
  },
}
