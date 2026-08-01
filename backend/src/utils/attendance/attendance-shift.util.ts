import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ATTENDANCE_LAYERS } from "@/constants/attendance.constants.ts"
import type { IAttendanceRecordDTO, IAttendanceShiftDTO } from "@/types/attendance.types.ts"
import {
  getAttendanceClockMinutes,
  toAttendanceInstant,
} from "@/utils/attendance/attendance-time-zone.util.ts"
import { AppError } from "@/utils/error.util.ts"

/** Shift duration in minutes — handles overnight shifts that cross midnight. */
export function getShiftDurationMinutes(startTime: number, endTime: number): number {
  if (endTime >= startTime) {
    return endTime - startTime
  }
  return ATTENDANCE_TIME_RULES.MINUTES_PER_DAY - startTime + endTime
}

/** True when current clock time falls inside the shift's minute window (inclusive). */
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

/** Extract minutes-since-midnight from a Date — used for PT multi-slot day selection. */
export function getMinutesFromDateTime(date: Date): number {
  return getAttendanceClockMinutes(date)
}

/** Exact match check for scheduled vs actual start/end — drives isMatched flag on checkout. */
export function isActualShiftMatched(
  actualStartTime: number,
  actualEndTime: number,
  shift: IAttendanceShiftDTO | null | undefined,
): boolean {
  return Boolean(
    shift && actualStartTime === shift.startTime && actualEndTime === shift.endTime,
  )
}

/** Grace period before/after shift boundaries — defaults from ATTENDANCE_TIME_RULES when unset. */
export function getWindowMinutes(shift?: IAttendanceShiftDTO | null): number {
  return shift?.gracePeriodMinutes ?? ATTENDANCE_TIME_RULES.DEFAULT_WINDOW_MINUTES
}

/** Type guard for cross-midnight shifts where endTime < startTime. */
export function isOvernightShift(
  shift: IAttendanceShiftDTO | null | undefined,
): shift is IAttendanceShiftDTO {
  return Boolean(shift && shift.endTime < shift.startTime)
}

/** Convert minute-based shift template to concrete Date objects on a calendar day. */
export function getShiftDateTimes(
  baseDate: Date,
  shift: IAttendanceShiftDTO,
): { start: Date; end: Date } {
  const start = toAttendanceInstant(baseDate, shift.startTime)
  const end = toAttendanceInstant(baseDate, shift.endTime)
  if (shift.endTime < shift.startTime) {
    end.setUTCDate(end.getUTCDate() + 1)
  }

  return { start, end }
}

/** FT fallback: pick shift whose grace-adjusted window contains the current minute. */
export function isWithinShiftSelectionWindow(
  currentMinutes: number,
  shift: IAttendanceShiftDTO,
): boolean {
  const windowStart =
    (shift.startTime - getWindowMinutes(shift) + ATTENDANCE_TIME_RULES.MINUTES_PER_DAY) %
    ATTENDANCE_TIME_RULES.MINUTES_PER_DAY

  return isWithinShiftWindow(currentMinutes, windowStart, shift.endTime)
}

/** Fail-fast when check-in is before grace window or after scheduled shift end. */
export function assertCheckInWindow(
  now: Date,
  date: Date,
  shift: IAttendanceShiftDTO | null,
): void {
  if (!shift) return

  const { start, end } = getShiftDateTimes(date, shift)
  const windowStart = new Date(start)
  windowStart.setUTCMinutes(windowStart.getUTCMinutes() - getWindowMinutes(shift))

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

/** Block checkout until grace window opens — prevents premature scan/check-out. */
export function isBeforeCheckOutWindow(
  now: Date,
  record: IAttendanceRecordDTO,
  shift: IAttendanceShiftDTO | null | undefined,
): boolean {
  if (!shift) return false

  const { end } = getShiftDateTimes(new Date(record.date), shift)
  const windowStart = new Date(end)
  windowStart.setUTCMinutes(windowStart.getUTCMinutes() - getWindowMinutes(shift))

  return now.getTime() < windowStart.getTime()
}

/** Extend active session lookup into the next calendar day for overnight shift checkout. */
export function isWithinOvernightCarryover(
  now: Date,
  record: IAttendanceRecordDTO,
  shift: IAttendanceShiftDTO | null | undefined,
): boolean {
  if (!isOvernightShift(shift)) return false

  const { end } = getShiftDateTimes(new Date(record.date), shift)
  const latestCheckoutAt = new Date(end)
  latestCheckoutAt.setUTCMinutes(
    latestCheckoutAt.getUTCMinutes() + getShiftDurationMinutes(shift.startTime, shift.endTime),
  )

  return now.getTime() <= latestCheckoutAt.getTime()
}
