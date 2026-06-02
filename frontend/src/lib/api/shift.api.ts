import apiClient from "@/lib/api-client"
import type { IShiftSchedule, IWorkingShift } from "@/types/attendance.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const shiftApi = {
  // Working Shifts
  getShifts: async (): Promise<IWorkingShift[]> => {
    const response = await apiClient.get<ApiResponse<IWorkingShift[]>>("/shifts")
    return response.data.data
  },

  createShift: async (data: Partial<IWorkingShift>): Promise<IWorkingShift> => {
    const response = await apiClient.post<ApiResponse<IWorkingShift>>("/shifts", data)
    return response.data.data
  },

  // Schedules
  getEmployeeSchedule: async (employeeId: string, date?: string): Promise<IShiftSchedule> => {
    const response = await apiClient.get<ApiResponse<IShiftSchedule>>(
      `/schedules/employee/${employeeId}`,
      { params: { date } },
    )
    return response.data.data
  },

  assignSchedule: async (data: Record<string, unknown>): Promise<IShiftSchedule> => {
    const response = await apiClient.post<ApiResponse<IShiftSchedule>>("/schedules/assign", data)
    return response.data.data
  },
}
