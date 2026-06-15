import apiClient from "@/lib/api-client"
import type {
  CreateProjectDto,
  PaginatedProjectsDto,
  Project,
  ProjectListQuery,
  ProjectMember,
  UpdateProjectDto,
} from "@/types/project.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const projectApi = {
  list: async (query?: ProjectListQuery): Promise<PaginatedProjectsDto> => {
    const response = await apiClient.get<ApiResponse<PaginatedProjectsDto>>("/projects", {
      params: query,
    })
    return response.data.data
  },

  getOne: async (id: string): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`)
    return response.data.data
  },

  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>("/projects", data)
    return response.data.data
  },

  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const response = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${id}`)
  },

  getMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`)
    return response.data.data
  },

  addMember: async (projectId: string, employeeId: string): Promise<void> => {
    await apiClient.post<ApiResponse<null>>(`/projects/${projectId}/members`, { employeeId })
  },

  removeMember: async (projectId: string, employeeId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/members/${employeeId}`)
  },
}
