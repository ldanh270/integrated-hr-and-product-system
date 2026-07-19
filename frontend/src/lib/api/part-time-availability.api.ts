import { API_ENDPOINTS } from "@/config/api.config"
import { PART_TIME_AVAILABILITY_QUERY_PARAMS } from "@/constants/attendance.constants"
import apiClient from "@/lib/api-client"
import type {
  IAssignPartTimeShiftsPayload,
  IAssignPartTimeShiftsResult,
  IPartTimeCoverageRequirement,
  IPartTimeWeeklyAvailability,
  ISuggestPartTimeShiftsResult,
  IUpsertPartTimeAvailabilityPayload,
} from "@/types/part-time-availability.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
}

/** Part-time weekly availability: employee self-service + admin shift assignment. */
export const partTimeAvailabilityApi = {
  /** Employee reads their own submission for a given week. */
  getMine: async (weekStart: string): Promise<IPartTimeWeeklyAvailability | null> => {
    const res = await apiClient.get<ApiResponse<IPartTimeWeeklyAvailability | null>>(
      API_ENDPOINTS.PART_TIME_AVAILABILITIES.MINE,
      { params: { [PART_TIME_AVAILABILITY_QUERY_PARAMS.WEEK_START]: weekStart } },
    )
    return res.data.data
  },

  upsertMine: async (
    payload: IUpsertPartTimeAvailabilityPayload,
  ): Promise<IPartTimeWeeklyAvailability> => {
    // Always persists as submitted from employee UI — triggers admin assign queue.
    const res = await apiClient.put<ApiResponse<IPartTimeWeeklyAvailability>>(
      API_ENDPOINTS.PART_TIME_AVAILABILITIES.MINE,
      payload,
    )
    return res.data.data
  },

  /** Admin roster of all PT submissions for shift assignment. */
  listForWeek: async (weekStart: string): Promise<IPartTimeWeeklyAvailability[]> => {
    const res = await apiClient.get<ApiResponse<IPartTimeWeeklyAvailability[]>>(
      API_ENDPOINTS.PART_TIME_AVAILABILITIES.BASE,
      { params: { [PART_TIME_AVAILABILITY_QUERY_PARAMS.WEEK_START]: weekStart } },
    )
    return res.data.data
  },

  getByEmployee: async (
    employeeId: string,
    weekStart: string,
  ): Promise<IPartTimeWeeklyAvailability | null> => {
    const res = await apiClient.get<ApiResponse<IPartTimeWeeklyAvailability | null>>(
      API_ENDPOINTS.PART_TIME_AVAILABILITIES.EMPLOYEE(employeeId),
      { params: { [PART_TIME_AVAILABILITY_QUERY_PARAMS.WEEK_START]: weekStart } },
    )
    return res.data.data
  },

  /** Creates employee shifts from submitted availability; null times = off day. */
  assignShifts: async (
    id: string,
    payload: IAssignPartTimeShiftsPayload,
  ): Promise<IAssignPartTimeShiftsResult> => {
    const res = await apiClient.post<ApiResponse<IAssignPartTimeShiftsResult>>(
      API_ENDPOINTS.PART_TIME_AVAILABILITIES.ASSIGN_SHIFTS(id),
      payload,
    )
    return res.data.data
  },

  /** Admin greedy suggestions from free slots + attendance reliability — does not persist. */
  suggestShifts: async (
    weekStart: string,
    coverageRequirements?: IPartTimeCoverageRequirement[],
  ): Promise<ISuggestPartTimeShiftsResult> => {
    const res = await apiClient.post<ApiResponse<ISuggestPartTimeShiftsResult>>(
      API_ENDPOINTS.PART_TIME_AVAILABILITIES.SUGGEST,
      { weekStart, coverageRequirements },
    )
    return res.data.data
  },
}
