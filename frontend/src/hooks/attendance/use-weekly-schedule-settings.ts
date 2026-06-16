import { API_ENDPOINTS } from "@/config/api.config"
import {
  WEEKLY_SCHEDULE_QUERY_KEYS,
  WEEKLY_SCHEDULE_SETTINGS_FIELDS,
} from "@/config/entities/attendance.config"
import apiClient from "@/lib/api-client"
import type { IWeeklyScheduleSettings } from "@/types/attendance.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useWeeklyScheduleSettings() {
  return useQuery({
    queryKey: WEEKLY_SCHEDULE_QUERY_KEYS.SETTINGS,
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.SCHEDULES.SETTINGS)
      const data = response.data?.data || response.data
      return data as IWeeklyScheduleSettings
    },
  })
}

export function useUpdateWeeklyScheduleSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      data: Pick<IWeeklyScheduleSettings, (typeof WEEKLY_SCHEDULE_SETTINGS_FIELDS)[number]>,
    ) => {
      const response = await apiClient.put(API_ENDPOINTS.SCHEDULES.SETTINGS, data)
      const resData = response.data?.data || response.data
      return resData as IWeeklyScheduleSettings
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: WEEKLY_SCHEDULE_QUERY_KEYS.SETTINGS })
    },
  })
}
