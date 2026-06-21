import apiClient from "@/lib/api-client"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
}

export interface CustomQuery {
  id: string
  name: string
  type: string
  projectId: string | null
  employeeId: string
  queryData: string
  createdAt: string
  updatedAt: string
}

export const customQueryApi = {
  list: async (projectId?: string, type: string = "gantt"): Promise<CustomQuery[]> => {
    const response = await apiClient.get<ApiResponse<CustomQuery[]>>("/custom-queries", {
      params: { projectId, type },
    })
    return response.data.data
  },

  create: async (data: {
    name: string
    type?: string
    projectId?: string | null
    queryData: string
  }): Promise<CustomQuery> => {
    const response = await apiClient.post<ApiResponse<CustomQuery>>("/custom-queries", data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/custom-queries/${id}`)
  },
}
