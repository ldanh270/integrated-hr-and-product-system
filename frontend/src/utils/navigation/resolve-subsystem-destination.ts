import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import {
  ATTENDANCE_SUBSYSTEM_PERMISSION,
  PAYROLL_SUBSYSTEM_PERMISSION,
  type SubsystemId,
} from "@/config/subsystem.config"

/**
 * Sends employees to their own payslips while preserving payroll administration
 * as the destination for users who hold the baseline payroll permission.
 */
export function resolveSubsystemDestination(
  subsystemId: SubsystemId,
  routePrefix: string,
  permissions: readonly string[] = [],
  roles: readonly string[] = [],
): string {
  // Permission is evaluated at click time so a refreshed auth profile immediately
  // changes the destination without introducing derived React state.
  const canManagePayroll = permissions.includes(PAYROLL_SUBSYSTEM_PERMISSION)
  const canReadAttendance = permissions.includes(ATTENDANCE_SUBSYSTEM_PERMISSION)

  // Keep employees under the /payroll prefix. Reusing /personal/payslips would make
  // MainLayout activate the Personal subsystem and expose the full personal sidebar.
  if (subsystemId === "payroll" && !canManagePayroll) {
    return ROUTES.PAYROLL.MY_PAYSLIPS
  }

  // Regular employees enter Attendance through their personal summary. This keeps
  // the Attendance sidebar active while role/permission filters leave only their
  // own attendance and the shared holiday calendar visible.
  if (subsystemId === "attendance") {
    if (!canReadAttendance) return ROUTES.ATTENDANCE.HOLIDAYS
    if (!roles.includes(ROLE.ADMIN)) return ROUTES.ATTENDANCE.SUMMARY
  }

  // Administrators and every non-payroll subsystem keep their configured root route.
  return routePrefix
}
