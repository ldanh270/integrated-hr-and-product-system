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
  myLogList: (query: ActivityLogQuery) => [...securityKeys.logs(), "me", query] as const,
  logDetail: (scope: "all" | "me", id: string) => [...securityKeys.logs(), scope, "detail", id] as const,
  roles: () => [...securityKeys.all, "roles"] as const,
  roleList: (params?: { page?: number; limit?: number }) => [...securityKeys.roles(), params] as const,
  roleDetail: (id: string) => [...securityKeys.roles(), "detail", id] as const,
  rolePermissions: (roleId: string) => [...securityKeys.roles(), "permissions", roleId] as const,
  permissions: (params?: { page?: number; limit?: number }) => [...securityKeys.all, "permissions", params] as const,
  employeeRoles: (employeeId: string) => [...securityKeys.all, "employees", "roles", employeeId] as const,
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
 * Hook to get paginated activity logs of the current user
 * @param query Query filters and pagination
 */
export function useMyActivityLogs(query: ActivityLogQuery) {
  return useQuery({
    queryKey: securityKeys.myLogList(query),
    queryFn: () => securityApi.listMyLogs(query),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to get detail of a specific activity log
 * @param id The log ID
 */
export function useActivityLog(id: string, scope: "all" | "me" = "all") {
  return useQuery({
    queryKey: securityKeys.logDetail(scope, id),
    queryFn: () => (scope === "me" ? securityApi.getMyLogDetail(id) : securityApi.getLogDetail(id)),
    enabled: !!id,
  })
}

export function useRoles(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: securityKeys.roleList(params),
    queryFn: () => securityApi.listRoles(params),
  })
}

export function useRole(id: string) {
  return useQuery({
    queryKey: securityKeys.roleDetail(id),
    queryFn: () => securityApi.getRole(id),
    enabled: !!id,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: securityApi.createRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.roles() })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
      securityApi.updateRole(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.roles() })
      void queryClient.invalidateQueries({ queryKey: securityKeys.roleDetail(id) })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: securityApi.deleteRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.roles() })
    },
  })
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: securityKeys.rolePermissions(roleId),
    queryFn: () => securityApi.getRolePermissions(roleId),
    enabled: !!roleId,
  })
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      securityApi.updateRolePermissions(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.rolePermissions(roleId) })
    },
  })
}

export function usePermissions(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: securityKeys.permissions(params),
    queryFn: () => securityApi.listPermissions(params),
  })
}

export function useEmployeeRoles(employeeId: string) {
  return useQuery({
    queryKey: securityKeys.employeeRoles(employeeId),
    queryFn: () => securityApi.getEmployeeRoles(employeeId),
    enabled: !!employeeId,
  })
}

export function useUpdateEmployeeRoles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, roleIds, version }: { employeeId: string; roleIds: string[]; version: number }) =>
      securityApi.updateEmployeeRoles(employeeId, roleIds, version),
    onSuccess: (_, { employeeId }) => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.employeeRoles(employeeId) })
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
