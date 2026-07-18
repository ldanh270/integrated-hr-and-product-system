import apiClient from "@/lib/api-client"

export interface ApiResponse<T> {
  data: T
  error?: { message: string; code: string } | null
  meta?: unknown
}

export interface IRegimeCategory {
  id: string
  name: string
  maxLateMinutes: number
  maxEarlyMinutes: number
  isDefault: boolean
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface ICreateRegimeCategoryPayload {
  name: string
  maxLateMinutes: number
  maxEarlyMinutes: number
}

export const regimeCategoryApi = {
  /**
   * Get all regime categories.
   */
  list: async () => {
    const res = await apiClient.get<ApiResponse<IRegimeCategory[]>>("/regime-categories")
    return res.data.data
  },

  /**
   * Create a new regime category.
   */
  create: async (payload: ICreateRegimeCategoryPayload) => {
    const res = await apiClient.post<ApiResponse<IRegimeCategory>>("/regime-categories", payload)
    return res.data.data
  },
}
