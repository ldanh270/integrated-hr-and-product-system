import { schedulesApi } from "@/lib/api/attendance.api"
import type { ISimulateWeeklyTemplateDraft } from "@/types/attendance.types"

import { useMutation, useQuery } from "@tanstack/react-query"

export const SCHEDULE_INSIGHTS_QUERY_KEY = (lookbackDays: number) =>
  ["schedule-insights", lookbackDays] as const

export const SCHEDULE_SUGGEST_TEMPLATES_QUERY_KEY = (lookbackDays: number) =>
  ["schedule-suggest-templates", lookbackDays] as const

/** Admin read-only attendance patterns for FT employees on active weekly templates. */
export function useScheduleInsights(lookbackDays: number) {
  return useQuery({
    queryKey: SCHEDULE_INSIGHTS_QUERY_KEY(lookbackDays),
    queryFn: () => schedulesApi.getInsights(lookbackDays),
    enabled: lookbackDays > 0,
  })
}

/** Heuristic template candidates derived from insights. */
export function useSuggestWeeklyTemplates(lookbackDays: number, enabled: boolean) {
  return useQuery({
    queryKey: SCHEDULE_SUGGEST_TEMPLATES_QUERY_KEY(lookbackDays),
    queryFn: () => schedulesApi.suggestTemplates(lookbackDays),
    enabled: enabled && lookbackDays > 0,
  })
}

/** What-if simulation for a draft weekly template. */
export function useSimulateWeeklyTemplate() {
  return useMutation({
    mutationFn: (draft: ISimulateWeeklyTemplateDraft) => schedulesApi.simulateTemplate(draft),
  })
}
