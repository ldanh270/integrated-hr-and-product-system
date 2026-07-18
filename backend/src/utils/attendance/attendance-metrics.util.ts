import { ATTENDANCE_STATUS } from "@/configs/entities/attendance.config.ts"
import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import type {
  IAttendanceMetricsDTO,
  IAttendanceRecordDTO,
  IAttendanceShiftDTO,
} from "@/types/attendance.types.ts"
import { getShiftDateTimes } from "@/utils/attendance/attendance-shift.util.ts"

function getBreakMinutesWithinAttendance(
  checkInAt: Date,
  checkOutAt: Date,
  scheduledStart: Date,
  shift: IAttendanceShiftDTO,
): number {
  // Legacy shifts have no unpaid break and therefore keep gross elapsed minutes.
  if (shift.breakStartTime == null || shift.breakEndTime == null) return 0

  // Break minutes share the shift's scheduled calendar day, not the checkout day.
  const breakStart = new Date(scheduledStart)
  breakStart.setHours(0, shift.breakStartTime, 0, 0)
  const breakEnd = new Date(scheduledStart)
  breakEnd.setHours(0, shift.breakEndTime, 0, 0)
  const overlapStart = Math.max(checkInAt.getTime(), breakStart.getTime())
  const overlapEnd = Math.min(checkOutAt.getTime(), breakEnd.getTime())

  // Intersection avoids deducting break time when the employee was not clocked in.
  return Math.max(
    0,
    Math.round((overlapEnd - overlapStart) / ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE),
  )
}

/**
 * Derive late/early/overtime minutes and attendance status at checkout.
 * Grace period reduces late penalty; status priority: late > early leave > overtime > on time.
 */
export function computeAttendanceMetrics(
  record: Pick<IAttendanceRecordDTO, "checkInAt" | "date">,
  shift: IAttendanceShiftDTO | null | undefined,
  checkOutAt: Date,
): IAttendanceMetricsDTO {
  if (!record.checkInAt) {
    return { status: ATTENDANCE_STATUS.ABSENT, totalWorkMinutes: 0 }
  }

  const checkInAt = new Date(record.checkInAt)
  // Gross duration is elapsed presence; unpaid break is deducted later when a shift exists.
  const grossWorkMinutes = Math.max(
    0,
    Math.round(
      (checkOutAt.getTime() - checkInAt.getTime()) / ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
    ),
  )

  if (!shift) {
    return {
      status: ATTENDANCE_STATUS.ON_TIME,
      totalWorkMinutes: grossWorkMinutes,
    }
  }

  const gracePeriod = shift.gracePeriodMinutes ?? 0
  const { start: scheduledStart, end: scheduledEnd } = getShiftDateTimes(
    new Date(record.date),
    shift,
  )
  const breakMinutes = getBreakMinutesWithinAttendance(checkInAt, checkOutAt, scheduledStart, shift)
  const totalWorkMinutes = Math.max(0, grossWorkMinutes - breakMinutes)

  let lateMinutes = 0
  let earlyLeaveMinutes = 0
  let overtimeMinutes = 0

  const minutesLate = Math.max(
    0,
    Math.round(
      (checkInAt.getTime() - scheduledStart.getTime()) /
        ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
    ) - gracePeriod,
  )
  if (minutesLate > 0) {
    lateMinutes = minutesLate
  }

  const minutesEarly = Math.max(
    0,
    Math.round(
      (scheduledEnd.getTime() - checkOutAt.getTime()) /
        ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
    ),
  )
  if (minutesEarly > 0) {
    earlyLeaveMinutes = minutesEarly
  }

  if (checkOutAt.getTime() > scheduledEnd.getTime()) {
    overtimeMinutes = Math.max(
      0,
      Math.round(
        (checkOutAt.getTime() - scheduledEnd.getTime()) /
          ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
      ),
    )
  }

  const status = lateMinutes
    ? ATTENDANCE_STATUS.LATE
    : earlyLeaveMinutes
      ? ATTENDANCE_STATUS.EARLY_LEAVE
      : overtimeMinutes
        ? ATTENDANCE_STATUS.OVERTIME
        : ATTENDANCE_STATUS.ON_TIME

  return {
    status,
    lateMinutes,
    earlyLeaveMinutes,
    overtimeMinutes,
    totalWorkMinutes,
  }
}
