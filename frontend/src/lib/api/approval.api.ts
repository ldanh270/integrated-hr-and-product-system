import type { IApplicationStatus } from "@/config/entities/attendance.config.ts"
import apiClient from "@/lib/api-client"

export interface IApprovalDetails {
  type?: string
  startDate?: string
  endDate?: string
  regimeType?: string
  position?: string
  headcount?: number
  expectedStart?: string
  reason?: string
  note?: string
}

export interface IApprovalItem {
  id: string
  category: "application" | "password_reset" | "recruitment_proposal"
  employeeId: string
  employeeName: string
  createdAt: string
  status: string
  details: IApprovalDetails
}

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const approvalApi = {
  getPendingApprovals: async (): Promise<IApprovalItem[]> => {
    const response = await apiClient.get<ApiResponse<IApprovalItem[]>>("/approvals")
    return response.data.data
  },

  processApproval: async (
    category: string,
    id: string,
    status: IApplicationStatus,
    rejectReason?: string,
  ): Promise<{ tempPassword?: string } | null> => {
    const response = await apiClient.patch<ApiResponse<{ tempPassword?: string } | null>>(
      `/approvals/${category}/${id}`,
      {
        status,
        rejectReason,
      },
    )
    return response.data.data
  },
}
