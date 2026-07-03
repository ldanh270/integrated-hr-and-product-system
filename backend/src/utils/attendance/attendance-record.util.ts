import type { IAttendanceRecordDTO } from "@/types/attendance.types.ts"
import type { IAttendanceRepository } from "@/types/attendance.types.ts"
import { isWithinOvernightCarryover } from "@/utils/attendance/attendance-shift.util.ts"

export function normalizeAttendanceDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export async function findActiveAttendanceRecord(
  attendanceRepo: IAttendanceRepository,
  employeeId: string,
  now: Date,
): Promise<IAttendanceRecordDTO | null> {
  const today = normalizeAttendanceDate(now)
  const todayRecord = await attendanceRepo.findByEmployeeAndDate(employeeId, today)
  if (todayRecord?.checkInAt) return todayRecord

  const previousDate = new Date(today)
  previousDate.setDate(previousDate.getDate() - 1)
  const previousRecord = await attendanceRepo.findByEmployeeAndDate(employeeId, previousDate)
  const previousShift = previousRecord?.employeeShift?.shift

  // Allow checkout against yesterday's open record while still inside overnight carryover.
  if (
    previousRecord?.checkInAt &&
    isWithinOvernightCarryover(now, previousRecord, previousShift)
  ) {
    return previousRecord
  }

  return todayRecord
}
