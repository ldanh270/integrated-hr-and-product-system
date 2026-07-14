import type { IApplicationStatus } from "@/config/entities/attendance.config"
import apiClient from "@/lib/api-client"

// ─── Response Envelope ───────────────────────────────────────────────────────

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  meta?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// ─── Application Detail Shapes ───────────────────────────────────────────────

export interface ILeaveDetail {
  leaveType: string
  regimeType?: string
  documentUrl?: string
}

export interface IOvertimeDetail {
  employeeShiftId: string
}

export interface ILateEarlyDetail {
  employeeShiftId: string
  lateMinutes?: number
  earlyMinutes?: number
}

export interface IShiftSwapDetail {
  employeeShiftId: string
  swapWithEmployeeId?: string
  swapWithShiftId?: string
}

export interface IWfhDetail {
  workLocation?: string
}

export interface IBusinessTripDetail {
  destination?: string
}

export interface IRegimeDetail {
  regimeType: "paid" | "unpaid"
}

export type IApplicationDetail =
  | ILeaveDetail
  | IOvertimeDetail
  | ILateEarlyDetail
  | IShiftSwapDetail
  | IWfhDetail
  | IBusinessTripDetail
  | IRegimeDetail

// ─── Core Application Interface ───────────────────────────────────────────────

export interface IApplication {
  id: string
  employeeId: string
  type: string
  status: IApplicationStatus
  startDate: string
  endDate: string
  reason?: string
  note?: string
  rejectReason?: string
  detail: IApplicationDetail & Record<string, unknown>
  createdAt: string
  updatedAt: string
  employee?: {
    id: string
    fullName: string
    email: string
    department?: string
  }
  assignedTo?: {
    id: string
    fullName: string
  }
  approvedBy?: {
    id: string
    fullName: string
  }
}

// ─── Submit DTO ───────────────────────────────────────────────────────────────

export interface ISubmitApplicationDTO {
  type: string
  startDate: string
  endDate: string
  reason?: string
  note?: string
  assignedToId?: string
  detail: IApplicationDetail & Record<string, unknown>
}

// ─── Query DTO ────────────────────────────────────────────────────────────────

export interface IListApplicationsQuery {
  page?: number
  /** Backend query schema uses "pageSize" (strict — do NOT send "limit") */
  pageSize?: number
  status?: IApplicationStatus | "all"
  type?: string
  keyword?: string
  startDate?: string
  endDate?: string
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const applicationApi = {
  /** List the authenticated employee's own applications */
  listMine: async (
    query?: IListApplicationsQuery,
  ): Promise<{ data: IApplication[]; meta: ApiResponse<IApplication[]>["meta"] }> => {
    const response = await apiClient.get<ApiResponse<IApplication[]>>("/applications/me", {
      params: query,
    })
    return { data: response.data.data, meta: response.data.meta }
  },

  /** Get a single application by ID */
  getById: async (id: string): Promise<IApplication> => {
    const response = await apiClient.get<ApiResponse<IApplication>>(`/applications/${id}`)
    return response.data.data
  },

  /** Submit a new application */
  submit: async (dto: ISubmitApplicationDTO): Promise<IApplication> => {
    const response = await apiClient.post<ApiResponse<IApplication>>("/applications", dto)
    return response.data.data
  },

  /** Submit multiple applications in bulk */
  submitBulk: async (forms: ISubmitApplicationDTO[]): Promise<IApplication[]> => {
    const response = await apiClient.post<ApiResponse<IApplication[]>>("/applications/bulk", { forms })
    return response.data.data
  },

  /** Cancel a pending application (own) */
  cancel: async (id: string): Promise<IApplication> => {
    const response = await apiClient.patch<ApiResponse<IApplication>>(
      `/applications/${id}/cancel`,
    )
    return response.data.data
  },

  /** Upload an attachment for an application */
  uploadAttachment: async (file: File): Promise<{ url: string; id: string }> => {
    const formData = new FormData()
    formData.append("attachment", file)

    const response = await apiClient.post<ApiResponse<{ url: string; id: string }>>(
      "/applications/upload-attachment",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    )

    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.message || "Failed to upload attachment")
    }
    return response.data.data
  },

  /** List all applications (manager role) */
  listAll: async (
    query?: IListApplicationsQuery,
  ): Promise<{ data: IApplication[]; meta: ApiResponse<IApplication[]>["meta"] }> => {
    const response = await apiClient.get<ApiResponse<IApplication[]>>("/applications", {
      params: query,
    })
    return { data: response.data.data, meta: response.data.meta }
  },

  /** List applications the user can approve */
  listApprovals: async (
    query?: IListApplicationsQuery,
  ): Promise<{ data: IApplication[]; meta: ApiResponse<IApplication[]>["meta"] }> => {
    const response = await apiClient.get<ApiResponse<IApplication[]>>("/applications/approvals", {
      params: query,
    })
    return { data: response.data.data, meta: response.data.meta }
  },

  /** Approve an application (manager role) — backend requires {status:"approved"} body */
  approve: async (id: string): Promise<IApplication> => {
    const response = await apiClient.patch<ApiResponse<IApplication>>(
      `/applications/${id}/approve`,
      { status: "approved" },
    )
    return response.data.data
  },

  /** Reject an application with reason (manager role) */
  reject: async (id: string, rejectReason: string): Promise<IApplication> => {
    const response = await apiClient.patch<ApiResponse<IApplication>>(
      `/applications/${id}/reject`,
      { rejectReason },
    )
    return response.data.data
  },

  /** Swap partner confirms the shift swap (partner_pending → pending) */
  swapConfirm: async (id: string): Promise<IApplication> => {
    const response = await apiClient.patch<ApiResponse<IApplication>>(
      `/applications/${id}/swap-confirm`,
      {},
    )
    return response.data.data
  },

  /** Swap partner rejects the shift swap (partner_pending → rejected) */
  swapReject: async (id: string, rejectReason: string): Promise<IApplication> => {
    const response = await apiClient.patch<ApiResponse<IApplication>>(
      `/applications/${id}/swap-reject`,
      { rejectReason },
    )
    return response.data.data
  },
}
