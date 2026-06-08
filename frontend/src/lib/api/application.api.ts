import type { IApplicationStatus, IApplicationType } from "@/config/entities/attendance.config"
import apiClient from "@/lib/api-client"
import type { IApplication, IApplicationDetails } from "@/types/attendance.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export interface ICreateApplicationRequest {
  type: IApplicationType
  details: IApplicationDetails
}

export const applicationApi = {
  /**
   * Get applications for the current logged-in employee
   */
  getMyApplications: async (): Promise<IApplication[]> => {
    const response = await apiClient.get<ApiResponse<IApplication[]>>("/applications/my")
    return response.data.data
  },

  /**
   * Submit a new application
   */
  createApplication: async (data: ICreateApplicationRequest): Promise<IApplication> => {
    const response = await apiClient.post<ApiResponse<IApplication>>("/applications", data)
    return response.data.data
  },

  /**
   * Cancel a pending application
   */
  cancelApplication: async (id: string): Promise<void> => {
    await apiClient.patch(`/applications/${id}/cancel`)
  },
}
