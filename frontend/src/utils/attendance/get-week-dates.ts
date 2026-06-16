import { getDayOfWeekFullLabel } from "@/config/entities/attendance.config"
import { addDays } from "@/utils/attendance/add-days"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { formatShortDate } from "@/utils/attendance/format-short-date"

export interface WeekDay {
  dayOfWeek: number
  date: Date
  dateKey: string
  label: string
  shortDate: string
}

/** Builds seven consecutive days starting from weekStart with labels and date keys. */
export function getWeekDates(
  weekStart: Date,
  getLabel: (dayOfWeek: number) => string = getDayOfWeekFullLabel,
): WeekDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    const dayOfWeek = date.getDay()

    return {
      dayOfWeek,
      date,
      dateKey: formatDateParam(date),
      label: getLabel(dayOfWeek),
      shortDate: formatShortDate(date),
    }
  })
}
