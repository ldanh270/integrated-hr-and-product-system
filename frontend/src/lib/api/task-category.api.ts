import apiClient from "@/lib/api-client"
import type { TaskCategory, CreateTaskCategoryDto, UpdateTaskCategoryDto } from "@/types/task-category.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const taskCategoryApi = {
  list: async (projectId: string): Promise<TaskCategory[]> => {
    const response = await apiClient.get<ApiResponse<TaskCategory[]>>(`/projects/${projectId}/categories`)
    return response.data.data
  },

  create: async (projectId: string, data: CreateTaskCategoryDto): Promise<TaskCategory> => {
    const response = await apiClient.post<ApiResponse<TaskCategory>>(`/projects/${projectId}/categories`, data)
    return response.data.data
  },

  update: async (projectId: string, id: string, data: UpdateTaskCategoryDto): Promise<TaskCategory> => {
    const response = await apiClient.patch<ApiResponse<TaskCategory>>(`/projects/${projectId}/categories/${id}`, data)
    return response.data.data
  },

  delete: async (projectId: string, id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/categories/${id}`)
  },
}
