import { ATTENDANCE_STATUS } from "@/configs/entities/attendance.config.ts"
import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import type {
  IAttendanceMetricsDTO,
  IAttendanceRecordDTO,
  IAttendanceShiftDTO,
} from "@/types/attendance.types.ts"
import { getShiftDateTimes } from "@/utils/attendance/attendance-shift.util.ts"

/**
 * Derive late/early/overtime minutes and attendance status at checkout.
 * Grace period reduces late penalty; status priority: late > early leave > overtime > on time.
 */
export function computeAttendanceMetrics(
  record: IAttendanceRecordDTO,
  shift: IAttendanceShiftDTO | null | undefined,
  checkOutAt: Date,
): IAttendanceMetricsDTO {
  if (!record.checkInAt) {
    return { status: ATTENDANCE_STATUS.ABSENT, totalWorkMinutes: 0 }
  }

  const checkInAt = new Date(record.checkInAt)
  const totalWorkMinutes = Math.max(
    0,
    Math.round(
      (checkOutAt.getTime() - checkInAt.getTime()) /
        ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
    ),
  )

  if (!shift) {
    return {
      status: ATTENDANCE_STATUS.ON_TIME,
      totalWorkMinutes,
    }
  }

  const gracePeriod = shift.gracePeriodMinutes ?? 0
  const { start: scheduledStart, end: scheduledEnd } = getShiftDateTimes(
    new Date(record.date),
    shift,
  )

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
