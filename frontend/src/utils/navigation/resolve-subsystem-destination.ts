import { ROUTES } from "@/config/routes.config"
import { PAYROLL_SUBSYSTEM_PERMISSION, type SubsystemId } from "@/config/subsystem.config"

/**
 * Sends employees to their own payslips while preserving payroll administration
 * as the destination for users who hold the baseline payroll permission.
 */
export function resolveSubsystemDestination(
  subsystemId: SubsystemId,
  routePrefix: string,
  permissions: readonly string[] = [],
): string {
  // Permission is evaluated at click time so a refreshed auth profile immediately
  // changes the destination without introducing derived React state.
  const canManagePayroll = permissions.includes(PAYROLL_SUBSYSTEM_PERMISSION)

  // Keep employees under the /payroll prefix. Reusing /personal/payslips would make
  // MainLayout activate the Personal subsystem and expose the full personal sidebar.
  if (subsystemId === "payroll" && !canManagePayroll) {
    return ROUTES.PAYROLL.MY_PAYSLIPS
  }

  // Administrators and every non-payroll subsystem keep their configured root route.
  return routePrefix
}
