import type { IEmployeeShiftWithShift } from "@/types/shift.types.ts"
import { formatScheduleDateKey } from "@/utils/schedule.util.ts"
import { getDateForWeekDay, minutesToTime, normalizeWeekStart } from "@/utils/part-time-availability.util.ts"

/** Builds per-day assigned shift labels for admin PT roster cards. */
export function buildAssignedDaySummaries(
  weekStart: Date,
  shifts: IEmployeeShiftWithShift[],
): { summaries: Partial<Record<number, string>>; hasAssigned: boolean } {
  const normalized = normalizeWeekStart(weekStart)
  const overrideShifts = shifts.filter((row) => row.isOverride)
  if (overrideShifts.length === 0) {
    return { summaries: {}, hasAssigned: false }
  }

  const byDate = new Map<string, IEmployeeShiftWithShift[]>()
  for (const row of overrideShifts) {
    const key = formatScheduleDateKey(new Date(row.assignedDate))
    const bucket = byDate.get(key) ?? []
    bucket.push(row)
    byDate.set(key, bucket)
  }

  const summaries: Partial<Record<number, string>> = {}
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
    const dateKey = formatScheduleDateKey(getDateForWeekDay(normalized, dayOfWeek))
    const rows = byDate.get(dateKey) ?? []
    if (rows.length === 0) continue

    summaries[dayOfWeek] = rows
      .toSorted((a, b) => a.shift.startTime - b.shift.startTime)
      .map((row) => `${minutesToTime(row.shift.startTime)}–${minutesToTime(row.shift.endTime)}`)
      .join(", ")
  }

  return { summaries, hasAssigned: Object.keys(summaries).length > 0 }
}
