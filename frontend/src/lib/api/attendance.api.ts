import apiClient from "@/lib/api-client"
import type { IAttendanceRecord, ICheckInOutRequest } from "@/types/attendance.types"

interface ApiResponse<T> {
  data: T
  error: any
  status?: string
}

export const attendanceApi = {
  getRecords: async (query?: {
    employeeId?: string
    startDate?: string
    endDate?: string
  }): Promise<IAttendanceRecord[]> => {
    const response = await apiClient.get<ApiResponse<IAttendanceRecord[]>>("/attendance", {
      params: query,
    })
    return response.data.data
  },

  checkIn: async (data: ICheckInOutRequest): Promise<IAttendanceRecord> => {
    const response = await apiClient.post<ApiResponse<IAttendanceRecord>>(
      "/attendance/check-in",
      data,
    )
    return response.data.data
  },

  checkOut: async (data: ICheckInOutRequest): Promise<IAttendanceRecord> => {
    const response = await apiClient.post<ApiResponse<IAttendanceRecord>>(
      "/attendance/check-out",
      data,
    )
    return response.data.data
  },

  scan: async (data: ICheckInOutRequest): Promise<IAttendanceRecord> => {
    const response = await apiClient.post<ApiResponse<IAttendanceRecord>>("/attendance/scan", data)
    return response.data.data
  },
}
