import apiClient from "@/lib/api-client"
import type {
  ProjectTaskStatus,
  CreateProjectTaskStatusDto,
  UpdateProjectTaskStatusDto,
} from "@/types/project-task-status.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const projectTaskStatusApi = {
  list: async (projectId: string): Promise<ProjectTaskStatus[]> => {
    const response = await apiClient.get<ApiResponse<ProjectTaskStatus[]>>(`/projects/${projectId}/statuses`)
    return response.data.data
  },

  getOne: async (projectId: string, id: string): Promise<ProjectTaskStatus> => {
    const response = await apiClient.get<ApiResponse<ProjectTaskStatus>>(`/projects/${projectId}/statuses/${id}`)
    return response.data.data
  },

  create: async (projectId: string, data: CreateProjectTaskStatusDto): Promise<ProjectTaskStatus> => {
    const response = await apiClient.post<ApiResponse<ProjectTaskStatus>>(`/projects/${projectId}/statuses`, data)
    return response.data.data
  },

  update: async (projectId: string, id: string, data: UpdateProjectTaskStatusDto): Promise<ProjectTaskStatus> => {
    const response = await apiClient.patch<ApiResponse<ProjectTaskStatus>>(`/projects/${projectId}/statuses/${id}`, data)
    return response.data.data
  },

  delete: async (projectId: string, id: string, fallbackStatusId?: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/statuses/${id}`, {
      params: { fallbackStatusId },
    })
  },
}
