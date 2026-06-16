import { getMonthRange } from "@/utils/attendance/get-month-range"

/** Returns ISO date bounds for the current calendar month. */
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date()

  return getMonthRange(now.getFullYear(), now.getMonth())
}
