import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import type {
  ActivityLogItem,
  ActivityLogQuery,
  LockedAccountItem,
  PaginatedActivityLogsDto,
  SecuritySummaryDto,
} from "@/types/security.types"

import type { AxiosRequestConfig } from "axios"

interface ApiResponse<T> {
  status: string
  data: T
  message?: string
}

export const securityApi = {
  getSummary: async (): Promise<SecuritySummaryDto> => {
    const response = await apiClient.get<ApiResponse<SecuritySummaryDto>>(
      API_ENDPOINTS.SECURITY.DASHBOARD,
    )
    return response.data.data
  },

  getLockedAccounts: async (): Promise<LockedAccountItem[]> => {
    const response = await apiClient.get<ApiResponse<LockedAccountItem[]>>(
      API_ENDPOINTS.SECURITY.LOCKED_ACCOUNTS,
    )
    return response.data.data
  },

  unlockAccount: async (employeeId: string): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.SECURITY.UNLOCK(employeeId))
  },

  listLogs: async (
    query?: ActivityLogQuery,
    config?: AxiosRequestConfig,
  ): Promise<PaginatedActivityLogsDto> => {
    const response = await apiClient.get<ApiResponse<PaginatedActivityLogsDto>>(
      API_ENDPOINTS.SECURITY.ACTIVITY_LOGS,
      { params: query, ...config },
    )
    return response.data.data
  },

  getLogDetail: async (id: string): Promise<ActivityLogItem> => {
    const response = await apiClient.get<ApiResponse<ActivityLogItem>>(
      API_ENDPOINTS.SECURITY.ACTIVITY_LOG_DETAIL(id),
    )
    return response.data.data
  },
}
