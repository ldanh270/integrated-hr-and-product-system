import { DAY_OF_WEEK_LABELS, UNKNOWN_DAY_OF_WEEK_LABEL } from "@/config/entities/attendance.config"

/** Resolves a day-of-week index to its short label from attendance config. */
export function getDayLabel(dayOfWeek: number): string {
  return DAY_OF_WEEK_LABELS[dayOfWeek] ?? UNKNOWN_DAY_OF_WEEK_LABEL
}
