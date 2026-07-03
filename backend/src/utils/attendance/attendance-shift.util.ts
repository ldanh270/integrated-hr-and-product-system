import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ATTENDANCE_LAYERS } from "@/constants/attendance.constants.ts"
import type { IAttendanceRecordDTO, IAttendanceShiftDTO } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

export function getShiftDurationMinutes(startTime: number, endTime: number): number {
  if (endTime >= startTime) {
    return endTime - startTime
  }
  return ATTENDANCE_TIME_RULES.MINUTES_PER_DAY - startTime + endTime
}

export function isWithinShiftWindow(
  currentMinutes: number,
  startTime: number,
  endTime: number,
): boolean {
  if (endTime >= startTime) {
    return currentMinutes >= startTime && currentMinutes <= endTime
  }
  return currentMinutes >= startTime || currentMinutes <= endTime
}

export function getMinutesFromDateTime(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function isActualShiftMatched(
  actualStartTime: number,
  actualEndTime: number,
  shift: IAttendanceShiftDTO | null | undefined,
): boolean {
  return Boolean(
    shift && actualStartTime === shift.startTime && actualEndTime === shift.endTime,
  )
}

export function getWindowMinutes(shift?: IAttendanceShiftDTO | null): number {
  return shift?.gracePeriodMinutes ?? ATTENDANCE_TIME_RULES.DEFAULT_WINDOW_MINUTES
}

export function isOvernightShift(
  shift: IAttendanceShiftDTO | null | undefined,
): shift is IAttendanceShiftDTO {
  return Boolean(shift && shift.endTime < shift.startTime)
}

export function getShiftDateTimes(
  baseDate: Date,
  shift: IAttendanceShiftDTO,
): { start: Date; end: Date } {
  const start = new Date(baseDate)
  start.setHours(Math.floor(shift.startTime / 60), shift.startTime % 60, 0, 0)

  const end = new Date(baseDate)
  end.setHours(Math.floor(shift.endTime / 60), shift.endTime % 60, 0, 0)
  if (shift.endTime < shift.startTime) {
    end.setDate(end.getDate() + 1)
  }

  return { start, end }
}

export function isWithinShiftSelectionWindow(
  currentMinutes: number,
  shift: IAttendanceShiftDTO,
): boolean {
  const windowStart =
    (shift.startTime - getWindowMinutes(shift) + ATTENDANCE_TIME_RULES.MINUTES_PER_DAY) %
    ATTENDANCE_TIME_RULES.MINUTES_PER_DAY

  return isWithinShiftWindow(currentMinutes, windowStart, shift.endTime)
}

export function assertCheckInWindow(
  now: Date,
  date: Date,
  shift: IAttendanceShiftDTO | null,
): void {
  if (!shift) return

  const { start, end } = getShiftDateTimes(date, shift)
  const windowStart = new Date(start)
  windowStart.setMinutes(windowStart.getMinutes() - getWindowMinutes(shift))

  if (now.getTime() < windowStart.getTime()) {
    throw new AppError(
      ATTENDANCE_ERROR_MESSAGES.CHECK_IN_TOO_EARLY,
      HttpStatusCode.BAD_REQUEST,
      ATTENDANCE_LAYERS.SERVICE,
    )
  }

  if (now.getTime() > end.getTime()) {
    throw new AppError(
      ATTENDANCE_ERROR_MESSAGES.CHECK_IN_TOO_LATE,
      HttpStatusCode.BAD_REQUEST,
      ATTENDANCE_LAYERS.SERVICE,
    )
  }
}

export function isBeforeCheckOutWindow(
  now: Date,
  record: IAttendanceRecordDTO,
  shift: IAttendanceShiftDTO | null | undefined,
): boolean {
  if (!shift) return false

  const { end } = getShiftDateTimes(new Date(record.date), shift)
  const windowStart = new Date(end)
  windowStart.setMinutes(windowStart.getMinutes() - getWindowMinutes(shift))

  return now.getTime() < windowStart.getTime()
}

export function isWithinOvernightCarryover(
  now: Date,
  record: IAttendanceRecordDTO,
  shift: IAttendanceShiftDTO | null | undefined,
): boolean {
  if (!isOvernightShift(shift)) return false

  const { end } = getShiftDateTimes(new Date(record.date), shift)
  const latestCheckoutAt = new Date(end)
  latestCheckoutAt.setMinutes(
    latestCheckoutAt.getMinutes() + getShiftDurationMinutes(shift.startTime, shift.endTime),
  )

  return now.getTime() <= latestCheckoutAt.getTime()
}
