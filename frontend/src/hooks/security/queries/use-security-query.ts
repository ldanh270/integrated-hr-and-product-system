import { securityApi } from "@/lib/api/security.api"
import type { ActivityLogQuery } from "@/types/security.types"
import { employeeKeys } from "@/hooks/employees/queries/useEmployeeQuery"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Query keys for security module
 */
export const securityKeys = {
  all: ["security"] as const,
  summary: () => [...securityKeys.all, "summary"] as const,
  lockedAccounts: () => [...securityKeys.all, "locked-accounts"] as const,
  logs: () => [...securityKeys.all, "logs"] as const,
  logList: (query: ActivityLogQuery) => [...securityKeys.logs(), query] as const,
  logDetail: (id: string) => [...securityKeys.logs(), "detail", id] as const,
}

/**
 * Hook to get security summary statistics
 */
export function useSecuritySummary() {
  return useQuery({
    queryKey: securityKeys.summary(),
    queryFn: securityApi.getSummary,
  })
}

/**
 * Hook to get locked user accounts
 */
export function useLockedAccounts() {
  return useQuery({
    queryKey: securityKeys.lockedAccounts(),
    queryFn: securityApi.getLockedAccounts,
  })
}

/**
 * Hook to unlock a user account
 */
export function useUnlockAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: string) => securityApi.unlockAccount(employeeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.summary() })
      void queryClient.invalidateQueries({ queryKey: securityKeys.lockedAccounts() })
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

/**
 * Hook to get paginated activity logs
 * @param query Query filters and pagination
 */
export function useActivityLogs(query: ActivityLogQuery) {
  return useQuery({
    queryKey: securityKeys.logList(query),
    queryFn: () => securityApi.listLogs(query),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to get detail of a specific activity log
 * @param id The log ID
 */
export function useActivityLog(id: string) {
  return useQuery({
    queryKey: securityKeys.logDetail(id),
    queryFn: () => securityApi.getLogDetail(id),
    enabled: !!id,
  })
}
