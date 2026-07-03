import type { IEmployeeType, IWorkScheduleType } from "@/config/entities/employee.config"
import type { NavItem } from "@/config/subsystem.config"
import type { User } from "@/store/auth-store"
import { resolveWorkScheduleType } from "@/utils/employee/is-part-time-work-schedule.util"

/** Filters sidebar items by role, employment category, and work schedule (PT vs FT). */
export function filterNavItems(
  items: NavItem[],
  user: User | null,
  employeeType?: IEmployeeType | null,
  workScheduleType?: IWorkScheduleType | null,
): NavItem[] {
  const scheduleFields = { employeeType, workScheduleType }

  return items.filter((item) => {
    if (
      item.permissions &&
      (!user || !item.permissions.every((permission) => user.permissions?.includes(permission)))
    ) {
      return false
    }

    if (item.roles?.length && (!user?.role || !item.roles.includes(user.role))) {
      return false
    }

    if (item.employeeTypes && (!employeeType || !item.employeeTypes.includes(employeeType))) {
      return false
    }

    // Resolve legacy part_time employeeType so nav gating matches schedule logic.
    if (item.workScheduleTypes) {
      const effectiveSchedule = resolveWorkScheduleType(scheduleFields)
      if (!item.workScheduleTypes.includes(effectiveSchedule)) {
        return false
      }
    }

    return true
  })
}
