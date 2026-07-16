import { normalizeScheduleDate } from "@/utils/schedule.util.ts"
import type { IAttendanceRecordDTO } from "@/types/attendance.types.ts"
import type { IPartTimeWeeklyAvailability, ISuggestPartTimeShiftsResult } from "@/types/part-time-availability.types.ts"

export interface IPartTimeReliabilityScore {
  score: number
  reasons: string[]
}

/** Converts minutes since midnight to HH:mm. */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

/** Earliest week an employee may submit availability (Monday after the current week). */
export function getEarliestRequestableWeekStart(referenceDate = new Date()): Date {
  const currentWeekStart = normalizeWeekStart(referenceDate)
  const nextWeekStart = new Date(currentWeekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)
  return nextWeekStart
}

/** True when weekStart is the current week or any earlier week. */
export function isPastOrCurrentAvailabilityWeek(
  weekStart: string | Date,
  referenceDate = new Date(),
): boolean {
  const normalized = normalizeWeekStart(weekStart)
  const earliest = getEarliestRequestableWeekStart(referenceDate)
  return normalized.getTime() < earliest.getTime()
}

/** Returns Monday 00:00 of the week containing the given date. */
export function normalizeWeekStart(date: string | Date): Date {
  const normalized = normalizeScheduleDate(new Date(date))
  const day = normalized.getDay()
  // getDay(): 0 = Sunday — roll back 6 days so ISO week starts on Monday, not Sunday.
  const diff = normalized.getDate() - day + (day === 0 ? -6 : 1)

  normalized.setDate(diff)
  return normalized
}

/** Maps dayOfWeek within a week starting Monday to a calendar date. */
export function getDateForWeekDay(weekStart: Date, dayOfWeek: number): Date {
  const start = normalizeWeekStart(weekStart)
  // Prisma dayOfWeek: 0 = Sunday at end of Mon–Sun display order (+6 from Monday).
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const date = new Date(start)
  date.setDate(start.getDate() + offset)
  return normalizeScheduleDate(date)
}

/** Converts HH:mm to minutes since midnight. */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function isOvernightShift(shift: { startTime: number; endTime: number }): boolean {
  // end < start means cross-midnight — not representable in a single-day availability slot.
  return shift.endTime < shift.startTime
}

/** True when shift fits entirely inside at least one same-day availability slot. */
export function shiftFitsAvailabilityDay(
  shift: { startTime: number; endTime: number },
  day: { isBusyAllDay: boolean; slots: Array<{ startTime: number; endTime: number }> } | undefined,
): boolean {
  if (!day || day.isBusyAllDay || day.slots.length === 0) return false
  // Overnight shifts span midnight — not representable by a single same-day slot.
  if (isOvernightShift(shift)) return false

  return day.slots.some(
    (slot) => shift.startTime >= slot.startTime && shift.endTime <= slot.endTime,
  )
}

/**
 * Builds shift suggestions for part-time employees based on their weekly availabilities and reliability scores.
 */
export function buildPartTimeShiftSuggestions(params: {
  weekStart: string
  availabilities: IPartTimeWeeklyAvailability[]
  scoresByEmployeeId: Map<string, IPartTimeReliabilityScore>
}): ISuggestPartTimeShiftsResult {
  const { weekStart, availabilities, scoresByEmployeeId } = params

  const suggestions = availabilities.flatMap((availability) => {
    const employeeId = availability.employeeId
    const fullName = availability.employee?.fullName || "Nhân viên"
    const scoreInfo = scoresByEmployeeId.get(employeeId) || { score: 50, reasons: [] }

    return availability.days.flatMap((day) => {
      if (day.isBusyAllDay) return []
      return day.slots.map((slot) => ({
        employeeId,
        fullName,
        dayOfWeek: day.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reliabilityScore: scoreInfo.score,
        reliabilityReasons: scoreInfo.reasons,
      }))
    })
  })

  return {
    weekStart,
    suggestions,
  }
}

/**
 * Scores an employee's reliability based on their punctuality and absences.
 */
export function scorePartTimeReliability(records: IAttendanceRecordDTO[]): IPartTimeReliabilityScore {
  if (!records || records.length === 0) {
    return {
      score: 50,
      reasons: ["Chưa có lịch sử chấm công — điểm trung lập"],
    }
  }

  let totalDeduction = 0
  const reasons: string[] = []
  let lateCount = 0
  let earlyLeaveCount = 0
  let absentCount = 0
  let perfectCount = 0

  for (const record of records) {
    let hasIssues = false
    if (record.status === "absent") {
      absentCount++
      totalDeduction += 20
      hasIssues = true
    }
    if (record.lateMinutes && record.lateMinutes > 0) {
      lateCount++
      totalDeduction += Math.min(15, record.lateMinutes * 0.5)
      hasIssues = true
    }
    if (record.earlyLeaveMinutes && record.earlyLeaveMinutes > 0) {
      earlyLeaveCount++
      totalDeduction += Math.min(15, record.earlyLeaveMinutes * 0.5)
      hasIssues = true
    }
    if (!hasIssues) {
      perfectCount++
    }
  }

  const baseScore = 100
  const score = Math.max(0, Math.min(100, Math.round(baseScore - totalDeduction)))

  if (perfectCount === records.length) {
    reasons.push("Điểm danh đầy đủ, đúng giờ")
  } else {
    if (absentCount > 0) {
      reasons.push(`Vắng mặt ${absentCount} buổi`)
    }
    if (lateCount > 0) {
      reasons.push(`Đi muộn ${lateCount} lần`)
    }
    if (earlyLeaveCount > 0) {
      reasons.push(`Về sớm ${earlyLeaveCount} lần`)
    }
  }

  if (reasons.length === 0) {
    reasons.push("Lịch sử chấm công bình thường")
  }

  return {
    score,
    reasons,
  }
}

