import apiClient from "@/lib/api-client"
import type {
  ProjectRole,
  CreateProjectRoleDto,
  UpdateProjectRoleDto,
} from "@/types/project-role.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const projectRoleApi = {
  list: async (projectId: string): Promise<ProjectRole[]> => {
    const response = await apiClient.get<ApiResponse<ProjectRole[]>>(`/projects/${projectId}/roles`)
    return response.data.data
  },

  create: async (projectId: string, data: CreateProjectRoleDto): Promise<ProjectRole> => {
    const response = await apiClient.post<ApiResponse<ProjectRole>>(`/projects/${projectId}/roles`, data)
    return response.data.data
  },

  update: async (projectId: string, id: string, data: UpdateProjectRoleDto): Promise<ProjectRole> => {
    const response = await apiClient.patch<ApiResponse<ProjectRole>>(`/projects/${projectId}/roles/${id}`, data)
    return response.data.data
  },

  delete: async (projectId: string, id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/roles/${id}`)
  },
}
