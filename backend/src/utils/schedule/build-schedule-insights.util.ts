import {
  ATTENDANCE_STATUS,
  DAY_OF_WEEK_FULL_LABELS,
  DAY_OF_WEEK_SHORT_LABELS,
  DAY_OF_WEEK_VALUES,
  SCHEDULE_INSIGHTS,
} from "@/configs/entities/attendance.config.ts"
import type { IAttendanceRecordDTO } from "@/types/attendance.types.ts"
import type {
  IScheduleInsightDayBucket,
  IScheduleInsightHotspot,
  IScheduleInsightsResult,
} from "@/types/shift.types.ts"
import { formatScheduleDateKey } from "@/utils/schedule.util.ts"

const SHORT_LABEL_BY_DAY = new Map(
  Object.entries(DAY_OF_WEEK_SHORT_LABELS).map(([day, label]) => [Number(day), label]),
)
const FULL_LABEL_BY_DAY = new Map(
  Object.entries(DAY_OF_WEEK_FULL_LABELS).map(([day, label]) => [Number(day), label]),
)

/** Creates actionable late/absence warnings, ranked by historical rate. */
function buildHotspots(byDayOfWeek: IScheduleInsightDayBucket[]): IScheduleInsightHotspot[] {
  const candidates: IScheduleInsightHotspot[] = []

  for (const day of byDayOfWeek) {
    if (day.total === 0) continue
    const fullLabel = FULL_LABEL_BY_DAY.get(day.dayOfWeek) ?? day.label

    if (day.lateRate >= SCHEDULE_INSIGHTS.LATE_RATE_THRESHOLD) {
      candidates.push({
        dayOfWeek: day.dayOfWeek,
        issue: "late",
        rate: day.lateRate,
        message: `${fullLabel}: ${Math.round(day.lateRate * 100)}% đi muộn — cân nhắc dời ca sáng hoặc tăng grace`,
      })
    }
    if (day.absentRate >= SCHEDULE_INSIGHTS.ABSENT_RATE_THRESHOLD) {
      candidates.push({
        dayOfWeek: day.dayOfWeek,
        issue: "absent",
        rate: day.absentRate,
        message: `${fullLabel}: ${Math.round(day.absentRate * 100)}% vắng — kiểm tra template / coverage`,
      })
    }
  }

  return candidates.sort((a, b) => b.rate - a.rate).slice(0, SCHEDULE_INSIGHTS.HOTSPOT_LIMIT)
}

/**
 * Aggregates attendance records into day-of-week insights + hotspot hints (no ML).
 */
export function buildScheduleInsights(options: {
  lookbackDays: number
  periodStart: Date
  periodEnd: Date
  employeeCount: number
  records: Array<Pick<IAttendanceRecordDTO, "date" | "status" | "lateMinutes">>
}): IScheduleInsightsResult {
  const buckets = new Map<
    number,
    { total: number; late: number; absent: number; onTime: number; lateMinutesSum: number }
  >()
  for (const dayOfWeek of DAY_OF_WEEK_VALUES) {
    buckets.set(dayOfWeek, { total: 0, late: 0, absent: 0, onTime: 0, lateMinutesSum: 0 })
  }

  let totalLate = 0
  let totalAbsent = 0
  let totalOnTime = 0
  let lateMinutesSum = 0

  for (const record of options.records) {
    const date = new Date(record.date)
    if (Number.isNaN(date.getTime())) continue
    const dayOfWeek = date.getDay()
    const bucket = buckets.get(dayOfWeek)
    if (!bucket) continue

    bucket.total++
    if (record.status === ATTENDANCE_STATUS.ABSENT) {
      bucket.absent++
      totalAbsent++
    } else if (record.status === ATTENDANCE_STATUS.LATE) {
      bucket.late++
      totalLate++
      bucket.lateMinutesSum += record.lateMinutes
      lateMinutesSum += record.lateMinutes
    } else if (
      record.status === ATTENDANCE_STATUS.ON_TIME ||
      record.status === ATTENDANCE_STATUS.OVERTIME ||
      record.status === ATTENDANCE_STATUS.EARLY_LEAVE
    ) {
      // Completed, non-absent records count as attendance while retaining any recorded lateness.
      bucket.onTime++
      totalOnTime++
      if (record.lateMinutes > 0) {
        bucket.lateMinutesSum += record.lateMinutes
        lateMinutesSum += record.lateMinutes
      }
    }
  }

  const byDayOfWeek: IScheduleInsightDayBucket[] = DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
    const bucket = buckets.get(dayOfWeek)
    if (!bucket) throw new Error(`Missing insight bucket for day ${dayOfWeek}`)
    const lateRate = bucket.total > 0 ? bucket.late / bucket.total : 0
    const absentRate = bucket.total > 0 ? bucket.absent / bucket.total : 0
    return {
      dayOfWeek,
      label: SHORT_LABEL_BY_DAY.get(dayOfWeek) ?? `D${dayOfWeek}`,
      total: bucket.total,
      late: bucket.late,
      absent: bucket.absent,
      onTime: bucket.onTime,
      lateRate: Number(lateRate.toFixed(SCHEDULE_INSIGHTS.RATE_PRECISION)),
      absentRate: Number(absentRate.toFixed(SCHEDULE_INSIGHTS.RATE_PRECISION)),
      avgLateMinutes: bucket.late > 0 ? Math.round(bucket.lateMinutesSum / bucket.late) : 0,
    }
  })

  const hotspots = buildHotspots(byDayOfWeek)

  return {
    lookbackDays: options.lookbackDays,
    periodStart: formatScheduleDateKey(options.periodStart),
    periodEnd: formatScheduleDateKey(options.periodEnd),
    employeeCount: options.employeeCount,
    totals: {
      late: totalLate,
      absent: totalAbsent,
      onTime: totalOnTime,
      avgLateMinutes: totalLate > 0 ? Math.round(lateMinutesSum / totalLate) : 0,
    },
    byDayOfWeek,
    hotspots,
  }
}
