import type { WeekDay } from "@/utils/attendance/get-week-dates"

/** Formats a week span as "DD/MM – DD/MM/YYYY" for calendar headers. */
export function getWeekRangeLabel(weekDays: WeekDay[]): string {
  const firstDay = weekDays[0]
  const lastDay = weekDays[weekDays.length - 1]

  return `${firstDay.shortDate} – ${lastDay.shortDate}/${lastDay.date.getFullYear()}`
}
