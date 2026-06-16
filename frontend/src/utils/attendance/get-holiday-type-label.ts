import {
  HOLIDAY_TYPE_LABELS,
  UNKNOWN_HOLIDAY_TYPE_LABEL,
  type IHolidayType,
} from "@/config/entities/attendance.config"

/** Resolves a holiday type enum to its display label. */
export function getHolidayTypeLabel(type: IHolidayType): string {
  return HOLIDAY_TYPE_LABELS[type] ?? UNKNOWN_HOLIDAY_TYPE_LABEL
}
