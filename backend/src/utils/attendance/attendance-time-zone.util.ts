/** Centralizes conversion between persisted instants and the configured attendance timezone. */
import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"

/** Converts a stored instant to minutes from midnight in the attendance timezone. */
export function getAttendanceClockMinutes(value: Date | string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ATTENDANCE_TIME_RULES.TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value))
  const hour = Number(parts.find((part) => part.type === "hour")?.value)
  const minute = Number(parts.find((part) => part.type === "minute")?.value)
  return hour * ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR + minute
}

/** Returns the attendance calendar date at UTC midnight for stable persisted date keys. */
export function getAttendanceDateOnly(value: Date | string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ATTENDANCE_TIME_RULES.TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value))
  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)
  const day = Number(parts.find((part) => part.type === "day")?.value)
  // Persist as UTC midnight after resolving the local attendance day. This avoids the
  // classic "Asia/Bangkok date appears as yesterday in UTC" bug in Prisma date filters.
  return new Date(Date.UTC(year, month - 1, day))
}

/** Formats a stored instant as HH:mm:ss in the attendance timezone. */
export function formatAttendanceClockTime(value: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ATTENDANCE_TIME_RULES.TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value))
}

/** Creates an instant whose wall-clock value matches the shift time in the attendance timezone. */
export function toAttendanceInstant(date: Date, minutes: number): Date {
  // Shift templates store wall-clock minutes, not UTC minutes. Subtracting the configured
  // offset turns "08:00 local" into the correct instant for comparisons and metrics.
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      minutes - ATTENDANCE_TIME_RULES.UTC_OFFSET_MINUTES,
    ),
  )
}
