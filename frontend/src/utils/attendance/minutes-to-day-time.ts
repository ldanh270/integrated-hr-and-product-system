import { ATTENDANCE_TIME_RULES } from "@/config/rules/attendance.config"

/** Converts minute-of-day to HH:mm, wrapping values past midnight. */
export function minutesToDayTime(minutes: number): string {
  const normalizedMinutes =
    (minutes + ATTENDANCE_TIME_RULES.MINUTES_PER_DAY) % ATTENDANCE_TIME_RULES.MINUTES_PER_DAY
  const hours = Math.floor(normalizedMinutes / 60)
  const mins = normalizedMinutes % 60

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}
