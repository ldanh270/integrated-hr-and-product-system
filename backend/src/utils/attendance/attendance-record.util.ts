import type { IAttendanceRecordDTO } from "@/types/attendance.types.ts"
import type { IAttendanceRepository } from "@/types/attendance.types.ts"
import { isWithinOvernightCarryover } from "@/utils/attendance/attendance-shift.util.ts"
import { getAttendanceDateOnly } from "@/utils/attendance/attendance-time-zone.util.ts"

/** Strip time component so date-bound repo queries align on local midnight. */
export function normalizeAttendanceDate(date: Date): Date {
  return getAttendanceDateOnly(date)
}

/**
 * Resolve the attendance session an employee is currently in.
 * Checks today first, then yesterday's open record during overnight carryover.
 */
export async function findActiveAttendanceRecord(
  attendanceRepo: IAttendanceRepository,
  employeeId: string,
  now: Date,
): Promise<IAttendanceRecordDTO | null> {
  const today = normalizeAttendanceDate(now)
  const openToday = await attendanceRepo.findOpenByEmployeeAndDate?.(employeeId, today)
  if (openToday?.checkInAt && !openToday.checkOutAt) return openToday

  const todayRecord = await attendanceRepo.findByEmployeeAndDate(employeeId, today)
  if (todayRecord?.checkInAt && !todayRecord.checkOutAt) return todayRecord

  const previousDate = new Date(today)
  previousDate.setUTCDate(previousDate.getUTCDate() - 1)
  const previousRecord =
    (await attendanceRepo.findOpenByEmployeeAndDate?.(employeeId, previousDate)) ??
    (await attendanceRepo.findByEmployeeAndDate(employeeId, previousDate))
  const previousShift = previousRecord?.employeeShift?.shift

  // Allow checkout against yesterday's open record while still inside overnight carryover.
  if (
    previousRecord?.checkInAt &&
    !previousRecord.checkOutAt &&
    isWithinOvernightCarryover(now, previousRecord, previousShift)
  ) {
    return previousRecord
  }

  return null
}
