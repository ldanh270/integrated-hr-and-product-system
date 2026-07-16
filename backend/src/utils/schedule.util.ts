import type { IAttendanceRecordDTO } from "@/types/attendance.types.ts"
import type {
  IScheduleInsightsResult,
  ISuggestWeeklyTemplatesResult,
  ISimulateWeeklyTemplateDraft,
  ISimulateWeeklyTemplateResult,
} from "@/types/shift.types.ts"

/** Normalizes a date to midnight local time. */
export function normalizeScheduleDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

/** ISO date key (YYYY-MM-DD) in local time. */
export function formatScheduleDateKey(date: Date): string {
  const normalized = normalizeScheduleDate(date)
  const year = normalized.getFullYear()
  const month = String(normalized.getMonth() + 1).padStart(2, "0")
  const day = String(normalized.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Computes the rotating week index within a multi-week cycle. */
export function getCycleWeekIndex(
  targetDate: Date,
  validFrom: Date,
  cycleWeeks: number,
): number {
  if (cycleWeeks <= 1) return 0

  const start = normalizeScheduleDate(validFrom)
  const target = normalizeScheduleDate(targetDate)
  const diffDays = Math.floor((target.getTime() - start.getTime()) / 86_400_000)
  const weekNumber = Math.floor(diffDays / 7)
  return ((weekNumber % cycleWeeks) + cycleWeeks) % cycleWeeks
}

export interface ISchedulePatternDay {
  dayOfWeek: number
  weekIndex?: number
  shiftId?: string | null
  shift?: {
    id?: string
    name?: string
    startTime: number
    endTime: number
  } | null
}

export interface ISchedulePattern {
  id?: string
  validFrom?: Date | string
  cycleWeeks?: number | null
  days?: ISchedulePatternDay[]
}

/** Resolves the planned shift for a date from a recurring schedule pattern. */
export function resolveShiftFromSchedule(
  schedule: ISchedulePattern | null | undefined,
  date: Date,
): ISchedulePatternDay | null {
  if (!schedule?.days?.length) return null

  const cycleWeeks = schedule.cycleWeeks ?? 1
  const weekIndex =
    cycleWeeks > 1 && schedule.validFrom
      ? getCycleWeekIndex(date, new Date(schedule.validFrom), cycleWeeks)
      : 0
  const dayOfWeek = date.getDay()

  return (
    schedule.days.find(
      (item) => item.dayOfWeek === dayOfWeek && (item.weekIndex ?? 0) === weekIndex,
    ) ?? null
  )
}

/** Iterates each calendar day from start through end (inclusive). */
export function* eachScheduleDate(start: Date, end: Date): Generator<Date> {
  const cursor = normalizeScheduleDate(start)
  const last = normalizeScheduleDate(end)

  while (cursor <= last) {
    yield new Date(cursor)
    cursor.setDate(cursor.getDate() + 1)
  }
}

/**
 * Builds schedule insights based on historical attendance records.
 */
export function buildScheduleInsights(params: {
  lookbackDays: number
  periodStart: Date
  periodEnd: Date
  employeeCount: number
  records: IAttendanceRecordDTO[]
}): IScheduleInsightsResult {
  const { lookbackDays, periodStart, periodEnd, employeeCount, records } = params

  let totalLateMinutes = 0
  let totalEarlyLeaveMinutes = 0
  let totalOvertimeMinutes = 0
  let totalWorkMinutes = 0
  let lateRecordsCount = 0
  let earlyLeaveRecordsCount = 0
  let absentRecordsCount = 0
  let presentRecordsCount = 0

  for (const record of records) {
    if (record.status === "absent") {
      absentRecordsCount++
    } else {
      presentRecordsCount++
    }
    if (record.lateMinutes && record.lateMinutes > 0) {
      lateRecordsCount++
      totalLateMinutes += record.lateMinutes
    }
    if (record.earlyLeaveMinutes && record.earlyLeaveMinutes > 0) {
      earlyLeaveRecordsCount++
      totalEarlyLeaveMinutes += record.earlyLeaveMinutes
    }
    if (record.overtimeMinutes && record.overtimeMinutes > 0) {
      totalOvertimeMinutes += record.overtimeMinutes
    }
    if (record.totalWorkMinutes && record.totalWorkMinutes > 0) {
      totalWorkMinutes += record.totalWorkMinutes
    }
  }

  const totalPossibleRecords = records.length || 1
  const attendanceRate = Math.round((presentRecordsCount / totalPossibleRecords) * 100)
  const averageWorkMinutes = presentRecordsCount > 0 ? Math.round(totalWorkMinutes / presentRecordsCount) : 0

  return {
    lookbackDays,
    periodStart,
    periodEnd,
    employeeCount,
    totalLateMinutes,
    totalEarlyLeaveMinutes,
    totalOvertimeMinutes,
    averageWorkMinutes,
    lateRecordsCount,
    earlyLeaveRecordsCount,
    absentRecordsCount,
    attendanceRate,
  }
}

/**
 * Builds suggested weekly templates based on active shifts and schedule insights.
 */
export function buildSuggestedWeeklyTemplates(params: {
  insights: IScheduleInsightsResult
  shifts: Array<{
    id: string
    name: string
    startTime: string | number
    endTime: string | number
    isActive: boolean
  }>
}): ISuggestWeeklyTemplatesResult {
  const activeShifts = params.shifts.filter((s) => s.isActive)
  if (activeShifts.length === 0) {
    return { templates: [] }
  }

  // Suggest a standard template using the first active shift for weekdays (Mon-Fri)
  const primaryShift = activeShifts[0]
  const assignments = [1, 2, 3, 4, 5].map((day) => ({
    dayOfWeek: day,
    shiftId: primaryShift.id,
  }))

  return {
    templates: [
      {
        id: `tpl-suggested-${primaryShift.id}`,
        name: `Lịch tiêu chuẩn - ${primaryShift.name}`,
        score: 85,
        description: `Lịch làm việc các ngày trong tuần với ca ${primaryShift.name}. Khuyến nghị dựa trên tỷ lệ chuyên cần ${params.insights.attendanceRate || 100}%.`,
        assignments,
      },
    ],
  }
}

/**
 * Simulates a weekly template draft against historical insights to calculate a score.
 */
export function simulateWeeklyTemplateDraft(params: {
  draft: ISimulateWeeklyTemplateDraft
  insights: IScheduleInsightsResult
  shiftNamesById: Map<string, string>
}): ISimulateWeeklyTemplateResult {
  const { draft, insights } = params

  // Simple simulation calculation:
  // Base score is 80.
  // Add points if assignments cover weekdays.
  // Deduct points if we had high late/absent rate in insights.
  let score = 80

  const assignmentsCount = draft.assignments.length
  if (assignmentsCount >= 5) {
    score += 15
  } else if (assignmentsCount > 0) {
    score += assignmentsCount * 2
  }

  // Late rate penalty: deduct if average late minutes is high
  if (insights.totalLateMinutes && insights.employeeCount) {
    const avgLate = insights.totalLateMinutes / insights.employeeCount
    score -= Math.min(10, avgLate * 0.1)
  }

  // Attendance rate effect
  if (insights.attendanceRate && insights.attendanceRate < 90) {
    score -= (90 - insights.attendanceRate) * 0.5
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  const reasons: string[] = []
  if (score >= 90) {
    reasons.push("Độ phủ ca tốt và tỷ lệ chuyên cần lịch sử cao.")
  } else if (score >= 70) {
    reasons.push("Lịch làm việc cơ bản tốt nhưng có thể tối ưu thêm.")
  } else {
    reasons.push("Cần điều chỉnh do thiếu ca hoặc lịch sử đi muộn/vắng mặt cao.")
  }

  return {
    score,
    coverageRate: Math.round((assignmentsCount / 7) * 100),
    efficiencyScore: score,
    reasons,
  }
}

