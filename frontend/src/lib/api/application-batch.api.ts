import type { IApplicationStatus } from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"
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

// ─── ApplicationBatch Interface ───────────────────────────────────────────────

export interface IApplicationBatch {
  id: string
  employeeId: string
  type: string
  assignedToId?: string
  createdAt: string
  updatedAt: string
  employee?: {
    id: string
    fullName: string
    email: string
    position?: string
    avatarUrl?: string
  }
  assignedTo?: {
    id: string
    fullName: string
  }
  applications: IApplication[]
}

// ─── Submit Batch DTO ─────────────────────────────────────────────────────────

export interface IBatchItemDTO {
  startDate: string
  endDate?: string
  reason?: string
  note?: string
  detail: Record<string, unknown>
}

export interface ISubmitBatchDTO {
  type: string
  assignedToId?: string
  items: IBatchItemDTO[]
}

// ─── Query DTO ────────────────────────────────────────────────────────────────

export interface IListBatchesQuery {
  page?: number
  pageSize?: number
  type?: string
  status?: IApplicationStatus | "all"
  keyword?: string
  startDate?: string
  endDate?: string
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const applicationBatchApi = {
  /** Submit a new batch of applications */
  submit: async (dto: ISubmitBatchDTO): Promise<IApplicationBatch> => {
    const response = await apiClient.post<ApiResponse<IApplicationBatch>>(
      "/application-batches",
      dto,
    )
    return response.data.data
  },

  /** List the authenticated employee's own batches */
  listMine: async (
    query?: IListBatchesQuery,
  ): Promise<{ data: IApplicationBatch[]; meta: ApiResponse<IApplicationBatch[]>["meta"] }> => {
    const response = await apiClient.get<ApiResponse<IApplicationBatch[]>>(
      "/application-batches/me",
      { params: query },
    )
    return { data: response.data.data, meta: response.data.meta }
  },

  /** List all batches (manager role) */
  listAll: async (
    query?: IListBatchesQuery,
  ): Promise<{ data: IApplicationBatch[]; meta: ApiResponse<IApplicationBatch[]>["meta"] }> => {
    const response = await apiClient.get<ApiResponse<IApplicationBatch[]>>(
      "/application-batches",
      { params: query },
    )
    return { data: response.data.data, meta: response.data.meta }
  },

  /** Get a single batch by ID */
  getById: async (id: string): Promise<IApplicationBatch> => {
    const response = await apiClient.get<ApiResponse<IApplicationBatch>>(
      `/application-batches/${id}`,
    )
    return response.data.data
  },

  /** Cancel a batch (own, pending) */
  cancel: async (id: string): Promise<IApplicationBatch> => {
    const response = await apiClient.patch<ApiResponse<IApplicationBatch>>(
      `/application-batches/${id}/cancel`,
    )
    return response.data.data
  },
}
