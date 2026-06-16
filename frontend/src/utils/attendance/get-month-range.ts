import { formatDateParam } from "@/utils/attendance/format-date-param"

/** Returns ISO date bounds for the first and last day of a given month. */
export function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  return {
    startDate: formatDateParam(new Date(year, month, 1)),
    endDate: formatDateParam(new Date(year, month + 1, 0)),
  }
}
