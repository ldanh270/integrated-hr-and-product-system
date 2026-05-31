import apiClient from "@/lib/api-client"

export interface IApprovalItem {
  id: string
  category: "application" | "password_reset" | "recruitment_proposal"
  employeeId: string
  employeeName: string
  createdAt: string
  status: string
  details: Record<string, any>
}

interface ApiResponse<T> {
  data: T
  error: any
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
    status: "approved" | "rejected",
    rejectReason?: string,
  ): Promise<any> => {
    const response = await apiClient.patch<ApiResponse<any>>(`/approvals/${category}/${id}`, {
      status,
      rejectReason,
    })
    return response.data.data
  },
}
