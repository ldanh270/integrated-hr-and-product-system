import type { IHoliday, ISchedule } from "@/types/attendance.types"
import { formatDateParam } from "@/utils/attendance/format-date-param"

/** Counts working days in a month that match the weekly schedule and are not holidays. */
export function countScheduledShiftsInMonth(
  schedule: ISchedule | null | undefined,
  year: number,
  month: number,
  holidaysByDate: Map<string, IHoliday>,
): number {
  if (!schedule) return 0

  const lastDay = new Date(year, month + 1, 0).getDate()
  let count = 0

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month, day)
    const dateKey = formatDateParam(date)
    const isHoliday = holidaysByDate.has(dateKey)
    const isScheduled = schedule.days.some((item) => item.dayOfWeek === date.getDay())

    if (isScheduled && !isHoliday) count += 1
  }

  return count
}
