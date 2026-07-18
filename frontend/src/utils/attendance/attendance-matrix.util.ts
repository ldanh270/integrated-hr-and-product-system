/** Date and display-format helpers consumed by attendance matrix components. */
import { CHECK_IN_VARIANCE_STATUS } from "@/config/entities/attendance.config"
import { ATTENDANCE_TIME_RULES } from "@/config/rules/attendance.config"
import type { IAttendanceMatrixShift } from "@/types/attendance.types"

import dayjs from "dayjs"

/** Builds every ISO date key in an inclusive matrix range. */
export function getMatrixDates(start: string, end: string): string[] {
  const dates: string[] = []
  let cursor = dayjs(start)
  const last = dayjs(end)
  while (!cursor.isAfter(last, "day")) {
    dates.push(cursor.format("YYYY-MM-DD"))
    cursor = cursor.add(1, "day")
  }
  return dates
}

/** Formats an API timestamp in the browser's attendance clock. */
export function formatClock(value?: string): string {
  return value ? dayjs(value).format("HH:mm") : "--:--"
}

/** Formats scheduled-vs-actual check-in variance for a status pill. */
export function formatVariance(shift: IAttendanceMatrixShift): string {
  const value = shift.checkInVarianceMinutes
  if (value === undefined) return "Chưa check-in"
  if (shift.status === CHECK_IN_VARIANCE_STATUS.ON_TIME) return "Đúng giờ"
  const absolute = Math.abs(value)
  const hours = Math.floor(absolute / ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR)
  const minutes = absolute % ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR
  const duration = [hours ? `${hours} giờ` : "", minutes ? `${minutes} phút` : ""]
    .filter(Boolean)
    .join(" ")
  return `${shift.status === CHECK_IN_VARIANCE_STATUS.EARLY ? "Sớm" : "Muộn"} ${duration}`
}
