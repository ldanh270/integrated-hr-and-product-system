import type { IAttendanceRecord, IScheduleDay } from "@/types/attendance.types"
import { getMinutesFromDateTime } from "@/utils/attendance/get-minutes-from-date-time"

/** True when check-in/out times exactly match the scheduled shift bounds. */
export function isActualShiftMatched(
  record: IAttendanceRecord,
  scheduleDay?: IScheduleDay,
): boolean {
  const shift = scheduleDay?.shift
  const actualStart = getMinutesFromDateTime(record.checkInAt)
  const actualEnd = getMinutesFromDateTime(record.checkOutAt)

  return Boolean(shift && actualStart === shift.startTime && actualEnd === shift.endTime)
}
