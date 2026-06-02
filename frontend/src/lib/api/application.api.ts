import apiClient from "@/lib/api-client"
import type { IApplication } from "@/types/attendance.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const applicationApi = {
  createApplication: async (data: Partial<IApplication>): Promise<IApplication> => {
    const response = await apiClient.post<ApiResponse<IApplication>>("/applications", data)
    return response.data.data
  },

  getEmployeeApplications: async (employeeId: string): Promise<IApplication[]> => {
    const response = await apiClient.get<ApiResponse<IApplication[]>>(
      `/applications/employee/${employeeId}`,
    )
    return response.data.data
  },

  approveApplication: async (id: string, status: string): Promise<IApplication> => {
    const response = await apiClient.patch<ApiResponse<IApplication>>(
      `/applications/${id}/approve`,
      { status },
    )
    return response.data.data
  },
}
