import apiClient from "@/lib/api-client"
import type {
  ProjectTracker,
  CreateProjectTrackerDto,
  UpdateProjectTrackerDto,
} from "@/types/project-tracker.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const projectTrackerApi = {
  list: async (projectId: string): Promise<ProjectTracker[]> => {
    const response = await apiClient.get<ApiResponse<ProjectTracker[]>>(`/projects/${projectId}/trackers`)
    return response.data.data
  },

  create: async (projectId: string, data: CreateProjectTrackerDto): Promise<ProjectTracker> => {
    const response = await apiClient.post<ApiResponse<ProjectTracker>>(`/projects/${projectId}/trackers`, data)
    return response.data.data
  },

  update: async (projectId: string, id: string, data: UpdateProjectTrackerDto): Promise<ProjectTracker> => {
    const response = await apiClient.patch<ApiResponse<ProjectTracker>>(`/projects/${projectId}/trackers/${id}`, data)
    return response.data.data
  },

  delete: async (projectId: string, id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/trackers/${id}`)
  },
}
