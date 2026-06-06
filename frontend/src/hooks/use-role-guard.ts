import type { IEmployeeRole } from "@/config/entities/employee.config"
import { useAuthStore } from "@/store/auth-store"

/**
 * Hook to determine if the current user has access based on allowed roles.
 *
 * @param allowedRoles Array of roles that are permitted access.
 * @returns boolean indicating if the user has one of the allowed roles.
 */
export function useRoleGuard(allowedRoles: readonly IEmployeeRole[]): boolean {
  const role = useAuthStore((state) => state.user?.role)

  if (!role) return false

  return allowedRoles.includes(role as IEmployeeRole)
}
