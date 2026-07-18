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

/** Creates an instant whose wall-clock value matches the shift time in the attendance timezone. */
export function toAttendanceInstant(date: Date, minutes: number): Date {
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
