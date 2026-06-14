import { approvalsApi, shiftChangeRequestsApi } from "@/lib/api/attendance.api"
import type {
  IProcessApprovalPayload,
  ISubmitShiftChangeRequestPayload,
} from "@/types/attendance.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const SHIFT_CHANGE_REQUESTS_KEY = ["shift-change-requests"] as const
export const APPROVALS_KEY = ["approvals"] as const

export function useMyShiftChangeRequests() {
  return useQuery({
    queryKey: SHIFT_CHANGE_REQUESTS_KEY,
    queryFn: shiftChangeRequestsApi.getMine,
  })
}

export function useSubmitShiftChangeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ISubmitShiftChangeRequestPayload) => shiftChangeRequestsApi.submit(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIFT_CHANGE_REQUESTS_KEY }),
  })
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: APPROVALS_KEY,
    queryFn: approvalsApi.getPending,
  })
}

export function useProcessApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: IProcessApprovalPayload & { id: string }) =>
      approvalsApi.process(id, data),
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: APPROVALS_KEY }),
        qc.invalidateQueries({ queryKey: SHIFT_CHANGE_REQUESTS_KEY }),
      ])
    },
  })
}
