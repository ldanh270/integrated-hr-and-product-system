/** Pure builders for weekly/monthly workforce attendance matrix API responses. */
import {
  ATTENDANCE_MATRIX_VIEW,
  CHECK_IN_VARIANCE_STATUS,
  type ICheckInVarianceStatus,
} from "@/configs/entities/attendance.config.ts"
import {
  ATTENDANCE_MATRIX_RULES,
  ATTENDANCE_TIME_RULES,
} from "@/configs/rules/attendance.config.ts"
import type {
  IAttendanceMatrixDTO,
  IAttendanceMatrixEmployeeProfileDTO,
  IAttendanceMatrixQueryDTO,
  IAttendanceRecordDTO,
} from "@/types/attendance.types.ts"
import { getAttendanceClockMinutes } from "@/utils/attendance/attendance-time-zone.util.ts"

/** Returns a stable ISO calendar key without leaking server timezone behavior. */
function dateKey(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10)
}

/** Resolves the complete Monday-Sunday week or calendar month containing the anchor. */
export function resolveAttendanceMatrixRange(query: IAttendanceMatrixQueryDTO) {
  const anchor = new Date(`${query.anchor}T00:00:00.000Z`)
  let start = new Date(anchor)
  let end = new Date(anchor)

  if (query.view === ATTENDANCE_MATRIX_VIEW.MONTH) {
    start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
    end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0))
  } else {
    const mondayOffset =
      (anchor.getUTCDay() + ATTENDANCE_MATRIX_RULES.MONDAY_OFFSET_BASE) %
      ATTENDANCE_MATRIX_RULES.DAYS_PER_WEEK
    start = new Date(anchor.getTime() - mondayOffset * ATTENDANCE_TIME_RULES.MILLISECONDS_PER_DAY)
    end = new Date(
      start.getTime() +
        ATTENDANCE_MATRIX_RULES.MONDAY_OFFSET_BASE * ATTENDANCE_TIME_RULES.MILLISECONDS_PER_DAY,
    )
  }

  return { startDate: dateKey(start), endDate: dateKey(end) }
}

/** Classifies a check-in delta using the configured attendance grace period. */
export function classifyCheckInVariance(minutes?: number): ICheckInVarianceStatus {
  if (minutes === undefined) return CHECK_IN_VARIANCE_STATUS.UNAVAILABLE
  if (minutes < -ATTENDANCE_MATRIX_RULES.CHECK_IN_GRACE_MINUTES) {
    return CHECK_IN_VARIANCE_STATUS.EARLY
  }
  if (minutes > ATTENDANCE_MATRIX_RULES.CHECK_IN_GRACE_MINUTES) {
    return CHECK_IN_VARIANCE_STATUS.LATE
  }
  return CHECK_IN_VARIANCE_STATUS.ON_TIME
}

function varianceMinutes(record: IAttendanceRecordDTO): number | undefined {
  const scheduledStart = record.employeeShift?.shift?.startTime
  if (!record.checkInAt || scheduledStart === undefined) return undefined
  return getAttendanceClockMinutes(record.checkInAt) - scheduledStart
}

/** Groups attendance records by employee and calendar day for matrix rendering. */
export function buildAttendanceMatrix(
  query: IAttendanceMatrixQueryDTO,
  records: IAttendanceRecordDTO[],
  profiles: IAttendanceMatrixEmployeeProfileDTO[],
): IAttendanceMatrixDTO {
  const range = resolveAttendanceMatrixRange(query)
  const employees = new Map<string, IAttendanceMatrixDTO["employees"][number]>()

  for (const profile of profiles) {
    employees.set(profile.id, {
      employeeId: profile.id,
      employeeCode: profile.username,
      fullName: profile.fullName,
      email: profile.email,
      position: profile.position ?? undefined,
      days: [],
    })
  }

  for (const record of records) {
    const employee = employees.get(record.employeeId)
    if (!employee) continue

    const key = dateKey(record.date)
    let day = employee.days.find((item) => item.date === key)
    if (!day) {
      day = { date: key, shifts: [] }
      employee.days.push(day)
    }

    const variance = varianceMinutes(record)
    day.shifts.push({
      id: record.id,
      shiftName: record.employeeShift?.shift?.name,
      scheduledStart: record.employeeShift?.shift?.startTime,
      checkInAt: record.checkInAt ? new Date(record.checkInAt).toISOString() : undefined,
      checkOutAt: record.checkOutAt ? new Date(record.checkOutAt).toISOString() : undefined,
      checkInVarianceMinutes: variance,
      status: classifyCheckInVariance(variance),
    })
  }

  const result = [...employees.values()]
  result.forEach((employee) => employee.days.sort((a, b) => a.date.localeCompare(b.date)))
  result.sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))

  return {
    view: query.view,
    rangeStart: range.startDate,
    rangeEnd: range.endDate,
    employees: result,
  }
}
