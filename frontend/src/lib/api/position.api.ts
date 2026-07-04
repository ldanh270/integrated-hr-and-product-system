import apiClient from "@/lib/api-client"

export interface Position {
  id: string
  name: string
  code: string
  description: string | null
  allowedTaskTrackers: string[]
  allowedApplicationTypes: string[]
  createdAt: string
  updatedAt: string
}

export interface ProjectPositionRule {
  id: string
  projectId: string
  positionId: string
  allowedTaskTrackers: string[]
  allowedApplicationTypes: string[]
  createdAt: string
  updatedAt: string
  position?: Position
}

export interface CreatePositionDto {
  name: string
  code: string
  description?: string
  allowedTaskTrackers?: string[]
  allowedApplicationTypes?: string[]
}

export interface UpdatePositionDto {
  name?: string
  code?: string
  description?: string | null
  allowedTaskTrackers?: string[]
  allowedApplicationTypes?: string[]
}

export interface ProjectPositionRuleDto {
  positionId: string
  allowedTaskTrackers: string[]
  allowedApplicationTypes: string[]
}

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
}

export const positionApi = {
  list: async (): Promise<Position[]> => {
    const response = await apiClient.get<ApiResponse<Position[]>>("/positions")
    return response.data.data
  },

  getOne: async (id: string): Promise<Position> => {
    const response = await apiClient.get<ApiResponse<Position>>(`/positions/${id}`)
    return response.data.data
  },

  create: async (data: CreatePositionDto): Promise<Position> => {
    const response = await apiClient.post<ApiResponse<Position>>("/positions", data)
    return response.data.data
  },

  update: async (id: string, data: UpdatePositionDto): Promise<Position> => {
    const response = await apiClient.put<ApiResponse<Position>>(`/positions/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<Position> => {
    const response = await apiClient.delete<ApiResponse<Position>>(`/positions/${id}`)
    return response.data.data
  },

  // Project Rules
  listProjectRules: async (projectId: string): Promise<ProjectPositionRule[]> => {
    const response = await apiClient.get<ApiResponse<ProjectPositionRule[]>>(`/positions/projects/${projectId}/position-rules`)
    return response.data.data
  },

  saveProjectRules: async (projectId: string, rules: ProjectPositionRuleDto[]): Promise<ProjectPositionRule[]> => {
    const response = await apiClient.post<ApiResponse<ProjectPositionRule[]>>(`/positions/projects/${projectId}/position-rules`, { rules })
    return response.data.data
  },
}
