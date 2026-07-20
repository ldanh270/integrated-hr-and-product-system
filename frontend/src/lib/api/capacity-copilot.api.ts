/**
 * API client for Capacity Copilot.
 */
import apiClient from "@/lib/api-client"
import type {
  CapacityForecastResult,
  ForecastProjectCapacityDto,
} from "@/types/capacity-copilot.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
}

export const capacityCopilotApi = {
  // Keep capacity forecasting outside Project Task AI so task assignment behavior remains untouched.
  forecastProject: async (
    projectId: string,
    data: ForecastProjectCapacityDto,
  ): Promise<CapacityForecastResult> => {
    const response = await apiClient.post<ApiResponse<CapacityForecastResult>>(
      `/capacity-copilot/projects/${projectId}/forecast`,
      data,
    )
    return response.data.data
  },
}
