import { MONTH_LABELS, UNKNOWN_MONTH_LABEL } from "@/config/entities/attendance.config"

/** Resolves a zero-based month index to its display name. */
export function getMonthName(month: number): string {
  return MONTH_LABELS.get(month) ?? UNKNOWN_MONTH_LABEL
}
