import { PART_TIME_AVAILABILITY_QUERY_KEYS } from "@/config/entities/part-time-availability.config"
import { partTimeAvailabilityApi } from "@/lib/api/part-time-availability.api"
import type {
  IAssignPartTimeShiftsPayload,
  IUpsertPartTimeAvailabilityPayload,
} from "@/types/part-time-availability.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** Employee reads own weekly availability for the selected week. */
export function useMyPartTimeAvailability(weekStart: string) {
  return useQuery({
    queryKey: PART_TIME_AVAILABILITY_QUERY_KEYS.MINE(weekStart),
    queryFn: () => partTimeAvailabilityApi.getMine(weekStart),
    enabled: Boolean(weekStart),
  })
}

/** Employee creates or updates their weekly availability submission. */
export function useUpsertMyPartTimeAvailability(weekStart: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: IUpsertPartTimeAvailabilityPayload) =>
      partTimeAvailabilityApi.upsertMine(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PART_TIME_AVAILABILITY_QUERY_KEYS.MINE(weekStart),
      })
      // Employee edits must refresh the admin roster for the same week.
      void queryClient.invalidateQueries({
        queryKey: PART_TIME_AVAILABILITY_QUERY_KEYS.LIST(weekStart),
      })
    },
  })
}

/** Admin roster of submitted availability for a given week. */
export function usePartTimeAvailabilityList(weekStart: string) {
  return useQuery({
    queryKey: PART_TIME_AVAILABILITY_QUERY_KEYS.LIST(weekStart),
    queryFn: () => partTimeAvailabilityApi.listForWeek(weekStart),
    enabled: Boolean(weekStart),
    // Admins may assign shifts in another tab; always refetch on open.
    refetchOnMount: "always",
  })
}

/** Admin assigns shifts when status is submitted (or legacy approved). */
export function useAssignPartTimeShifts(weekStart: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: IAssignPartTimeShiftsPayload & { id: string }) =>
      partTimeAvailabilityApi.assignShifts(id, payload),
    onSuccess: () => {
      // Refresh admin list so assigned/skipped counts reflect the latest state.
      void queryClient.invalidateQueries({
        queryKey: PART_TIME_AVAILABILITY_QUERY_KEYS.LIST(weekStart),
      })
    },
  })
}
