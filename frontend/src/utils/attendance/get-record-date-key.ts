import type { IAttendanceRecord } from "@/types/attendance.types"
import { formatDateParam } from "@/utils/attendance/format-date-param"

/** Normalizes an attendance record date to YYYY-MM-DD for lookup maps. */
export function getRecordDateKey(record: IAttendanceRecord): string {
  return formatDateParam(new Date(record.date))
}
