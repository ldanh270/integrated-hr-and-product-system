import {
  DAY_OF_WEEK_FULL_LABELS,
  DAY_OF_WEEK_SHORT_LABELS,
  DAY_OF_WEEK_VALUES,
  SCHEDULE_INSIGHTS,
} from "@/configs/entities/attendance.config.ts"
import type {
  IScheduleInsightDayBucket,
  IScheduleInsightsResult,
  ISimulateWeeklyTemplateDraft,
  ISimulateWeeklyTemplateResult,
  ISuggestedWeeklyTemplateCandidate,
  ISuggestWeeklyTemplatesResult,
} from "@/types/shift.types.ts"

interface IShiftOption {
  id: string
  name: string
  startTime: number
  endTime: number
  isActive: boolean
}

/** Picks earliest active daytime shift for workdays; null = off. */
export function pickDefaultShift(shifts: IShiftOption[]): IShiftOption | null {
  const active = shifts
    .filter((shift) => shift.isActive)
    .sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime)
  return active[0] ?? null
}

/** Later shift (afternoon) when available — used to avoid high late-rate mornings. */
export function pickLaterShift(shifts: IShiftOption[]): IShiftOption | null {
  const active = shifts
    .filter((shift) => shift.isActive)
    .sort((a, b) => b.startTime - a.startTime || a.endTime - b.endTime)
  return active[0] ?? pickDefaultShift(shifts)
}

/**
 * Builds 1–2 template candidates from attendance insights + active WorkingShift catalog.
 * Heuristic only — no ML / LLM.
 */
export function buildSuggestedWeeklyTemplates(options: {
  insights: IScheduleInsightsResult
  shifts: IShiftOption[]
}): ISuggestWeeklyTemplatesResult {
  const defaultShift = pickDefaultShift(options.shifts)
  const laterShift = pickLaterShift(options.shifts)
  const dayMap = new Map(options.insights.byDayOfWeek.map((day) => [day.dayOfWeek, day]))

  const candidates: ISuggestedWeeklyTemplateCandidate[] = []

  if (defaultShift) {
    const simpleDays = DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
      const isWorkDay = (SCHEDULE_INSIGHTS.WORK_DAYS as readonly number[]).includes(dayOfWeek)
      return {
        dayOfWeek,
        shiftId: isWorkDay ? defaultShift.id : null,
        shiftName: isWorkDay ? defaultShift.name : null,
      }
    })

    const simpleScore = scoreTemplateAgainstInsights(simpleDays, dayMap)
    candidates.push({
      id: "simple-weekday",
      name: "Tuần cố định T2–T6",
      description: `Ca ${defaultShift.name} các ngày làm việc; CN/T7 nghỉ.`,
      cycleWeeks: 1,
      predictedCoverageScore: simpleScore,
      tradeOffs: [
        "Đơn giản, dễ áp dụng hàng loạt",
        "Không xoay ca — ít linh hoạt khi muộn cao vào sáng",
      ],
      weeks: [{ weekIndex: 0, days: simpleDays }],
    })
  }

  if (defaultShift && laterShift && laterShift.id !== defaultShift.id) {
    const rotatingDays = DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
      const isWorkDay = (SCHEDULE_INSIGHTS.WORK_DAYS as readonly number[]).includes(dayOfWeek)
      if (!isWorkDay) {
        return { dayOfWeek, shiftId: null, shiftName: null }
      }
      const bucket = dayMap.get(dayOfWeek)
      const useLater =
        bucket !== undefined && bucket.lateRate >= SCHEDULE_INSIGHTS.LATE_RATE_THRESHOLD
      const shift = useLater ? laterShift : defaultShift
      return {
        dayOfWeek,
        shiftId: shift.id,
        shiftName: shift.name,
      }
    })

    const rotatingScore = scoreTemplateAgainstInsights(rotatingDays, dayMap)
    candidates.push({
      id: "late-aware-weekday",
      name: "T2–T6 tránh muộn sáng",
      description: `Ngày muộn cao dùng ca ${laterShift.name}; ngày khác dùng ${defaultShift.name}.`,
      cycleWeeks: 1,
      predictedCoverageScore: rotatingScore,
      tradeOffs: [
        "Giảm rủi ro đi muộn dựa trên lịch sử",
        "Cần ≥2 ca active trong catalog",
      ],
      weeks: [{ weekIndex: 0, days: rotatingDays }],
    })
  }

  candidates.sort((a, b) => b.predictedCoverageScore - a.predictedCoverageScore)
  const limited = candidates.slice(0, SCHEDULE_INSIGHTS.CANDIDATE_LIMIT)

  return {
    lookbackDays: options.insights.lookbackDays,
    basedOnInsights: {
      employeeCount: options.insights.employeeCount,
      periodStart: options.insights.periodStart,
      periodEnd: options.insights.periodEnd,
    },
    candidates: limited,
  }
}

function scoreTemplateAgainstInsights(
  days: Array<{ dayOfWeek: number; shiftId: string | null }>,
  dayMap: Map<number, IScheduleInsightDayBucket>,
): number {
  let score = 88
  for (const day of days) {
    if (!day.shiftId) continue
    const bucket = dayMap.get(day.dayOfWeek)
    if (!bucket || bucket.total === 0) continue
    score -= Math.round(bucket.lateRate * 25)
    score -= Math.round(bucket.absentRate * 20)
  }
  return Math.max(40, Math.min(99, score))
}

/**
 * What-if: projects late/absent risk for a draft template using historical day rates.
 */
export function simulateWeeklyTemplateDraft(options: {
  draft: ISimulateWeeklyTemplateDraft
  insights: IScheduleInsightsResult
  shiftNamesById: Map<string, string>
}): ISimulateWeeklyTemplateResult {
  const simulateWeeks = Math.min(8, Math.max(1, options.draft.simulateWeeks ?? 4))
  const dayMap = new Map(options.insights.byDayOfWeek.map((day) => [day.dayOfWeek, day]))

  const assignedByDay = new Map<number, number>()
  for (const dayOfWeek of DAY_OF_WEEK_VALUES) {
    assignedByDay.set(dayOfWeek, 0)
  }

  for (const week of options.draft.weeks) {
    for (const day of week.days) {
      if (day.shiftId) {
        assignedByDay.set(day.dayOfWeek, (assignedByDay.get(day.dayOfWeek) ?? 0) + 1)
      }
    }
  }

  const cycleWeeks = Math.max(1, options.draft.cycleWeeks)
  const cyclesInHorizon = Math.ceil(simulateWeeks / cycleWeeks)

  let totalAssignedSlots = 0
  let offSlots = 0
  let lateRiskSum = 0
  let absentRiskSum = 0
  let riskDays = 0

  const byDayOfWeek = DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
    const perCycle = assignedByDay.get(dayOfWeek) ?? 0
    const assignedShifts = perCycle * cyclesInHorizon
    const bucket = dayMap.get(dayOfWeek)
    const lateRate = bucket?.lateRate ?? 0
    const absentRate = bucket?.absentRate ?? 0
    const hasAssignment = perCycle > 0

    if (hasAssignment) {
      totalAssignedSlots += assignedShifts
      lateRiskSum += lateRate
      absentRiskSum += absentRate
      riskDays++
    } else {
      offSlots += cyclesInHorizon
    }

    const fullLabel = DAY_OF_WEEK_FULL_LABELS[dayOfWeek] ?? DAY_OF_WEEK_SHORT_LABELS[dayOfWeek]
    let note = hasAssignment ? "Có ca trong draft" : "Nghỉ trong draft"
    if (hasAssignment && lateRate >= SCHEDULE_INSIGHTS.LATE_RATE_THRESHOLD) {
      note = `${fullLabel}: rủi ro muộn cao (${Math.round(lateRate * 100)}%) nếu giữ ca này`
    } else if (hasAssignment && absentRate >= SCHEDULE_INSIGHTS.ABSENT_RATE_THRESHOLD) {
      note = `${fullLabel}: rủi ro vắng cao (${Math.round(absentRate * 100)}%)`
    }

    return {
      dayOfWeek,
      label: DAY_OF_WEEK_SHORT_LABELS[dayOfWeek] ?? `D${dayOfWeek}`,
      assignedShifts,
      historicalLateRate: lateRate,
      historicalAbsentRate: absentRate,
      projectedLateRisk: hasAssignment ? lateRate : 0,
      projectedAbsentRisk: hasAssignment ? absentRate : 0,
      note,
    }
  })

  const messages: string[] = []
  const highLate = byDayOfWeek.filter(
    (day) => day.assignedShifts > 0 && day.projectedLateRisk >= SCHEDULE_INSIGHTS.LATE_RATE_THRESHOLD,
  )
  const highAbsent = byDayOfWeek.filter(
    (day) =>
      day.assignedShifts > 0 && day.projectedAbsentRisk >= SCHEDULE_INSIGHTS.ABSENT_RATE_THRESHOLD,
  )

  if (highLate.length > 0) {
    messages.push(
      `Nếu giữ draft: ${highLate.map((d) => d.label).join(", ")} có rủi ro muộn ≥${Math.round(SCHEDULE_INSIGHTS.LATE_RATE_THRESHOLD * 100)}%.`,
    )
  }
  if (highAbsent.length > 0) {
    messages.push(
      `Nếu giữ draft: ${highAbsent.map((d) => d.label).join(", ")} có rủi ro vắng ≥${Math.round(SCHEDULE_INSIGHTS.ABSENT_RATE_THRESHOLD * 100)}%.`,
    )
  }
  if (messages.length === 0) {
    messages.push("Draft ổn với pattern lịch sử — không có điểm nóng rõ.")
  }
  messages.push(
    `Mô phỏng ${simulateWeeks} tuần: ~${totalAssignedSlots} ô ca, ${offSlots} ô nghỉ (theo chu kỳ draft).`,
  )

  return {
    simulateWeeks,
    lookbackDays: options.insights.lookbackDays,
    summary: {
      totalAssignedSlots,
      offSlots,
      avgProjectedLateRisk:
        riskDays > 0 ? Number((lateRiskSum / riskDays).toFixed(3)) : 0,
      avgProjectedAbsentRisk:
        riskDays > 0 ? Number((absentRiskSum / riskDays).toFixed(3)) : 0,
    },
    byDayOfWeek,
    messages,
  }
}
