import type { IHolidayScope } from "@/config/entities/attendance.config"
import { HOLIDAY_SCOPE } from "@/config/entities/attendance.config"
import type { IHoliday } from "@/types/attendance.types"
import { formatDateParam } from "@/utils/attendance/format-date-param"

interface HolidayEmployeeRef {
  id: string
  positionId?: string | null
}

/**
 * Returns whether a holiday applies to the given employee.
 */
export function doesHolidayApplyToEmployee(
  holiday: IHoliday,
  employee: HolidayEmployeeRef,
): boolean {
  const scope = holiday.scope ?? HOLIDAY_SCOPE.ALL
  if (scope === HOLIDAY_SCOPE.ALL) return true
  if (scope === HOLIDAY_SCOPE.POSITION) {
    return Boolean(holiday.positionId && holiday.positionId === employee.positionId)
  }
  return Boolean(holiday.assignees?.some((a) => a.employeeId === employee.id))
}

/**
 * Picks the first holiday on a date that applies to the employee.
 */
export function pickHolidayForEmployee(
  holidaysOnDate: IHoliday[] | undefined,
  employee: HolidayEmployeeRef,
): IHoliday | undefined {
  if (!holidaysOnDate?.length) return undefined
  return holidaysOnDate.find((h) => doesHolidayApplyToEmployee(h, employee))
}

/**
 * Groups holidays by local YYYY-MM-DD date key.
 */
export function groupHolidaysByDate(holidays: IHoliday[]): Map<string, IHoliday[]> {
  const map = new Map<string, IHoliday[]>()
  for (const holiday of holidays) {
    const key = formatDateParam(new Date(holiday.date))
    const list = map.get(key) ?? []
    list.push(holiday)
    map.set(key, list)
  }
  return map
}

export type { IHolidayScope }
