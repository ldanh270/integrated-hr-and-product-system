import { shiftsApi } from "@/lib/api/attendance.api"
import type { ICreateShiftPayload, IUpdateShiftPayload } from "@/types/attendance.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const SHIFTS_KEY = ["shifts"] as const

export function useShifts() {
  return useQuery({
    queryKey: SHIFTS_KEY,
    queryFn: shiftsApi.getAll,
  })
}

export function useShiftById(id: string | null) {
  return useQuery({
    queryKey: ["shifts", id],
    queryFn: () => shiftsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateShiftPayload) => shiftsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}

export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: IUpdateShiftPayload & { id: string }) =>
      shiftsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}

export function useDeleteShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shiftsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}
