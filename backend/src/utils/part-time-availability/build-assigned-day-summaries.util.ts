/**
 * Presentation mapper for the admin roster.
 * It groups persisted employee shifts by weekday without changing assignment records.
 */
import type { IEmployeeShiftWithShift } from "@/types/shift.types.ts"
import {
  getDateForWeekDay,
  minutesToTime,
  normalizeWeekStart,
} from "@/utils/part-time-availability.util.ts"
import { formatScheduleDateKey } from "@/utils/schedule.util.ts"

/** Builds per-day assigned shift labels for admin PT roster cards. */
export function buildAssignedDaySummaries(
  weekStart: Date,
  shifts: IEmployeeShiftWithShift[],
): {
  summaries: Partial<Record<number, string>>
  slots: Partial<Record<number, Array<{ startTime: string; endTime: string }>>>
  hasAssigned: boolean
} {
  const normalized = normalizeWeekStart(weekStart)
  const overrideShifts = shifts.filter((row) => row.isOverride)
  if (overrideShifts.length === 0) {
    return { summaries: {}, slots: {}, hasAssigned: false }
  }

  const byDate = new Map<string, IEmployeeShiftWithShift[]>()
  for (const row of overrideShifts) {
    const key = formatScheduleDateKey(new Date(row.assignedDate))
    const bucket = byDate.get(key) ?? []
    bucket.push(row)
    byDate.set(key, bucket)
  }

  const summaryEntries: Array<[number, string]> = []
  const slotEntries: [number, { startTime: string; endTime: string }[]][] = []
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
    const dateKey = formatScheduleDateKey(getDateForWeekDay(normalized, dayOfWeek))
    const rows = byDate.get(dateKey) ?? []
    if (rows.length === 0) continue

    const sortedRows = rows.toSorted((a, b) => a.shift.startTime - b.shift.startTime)
    const slots = sortedRows.map((row) => ({
      startTime: minutesToTime(row.shift.startTime),
      endTime: minutesToTime(row.shift.endTime),
    }))

    slotEntries.push([dayOfWeek, slots])
    summaryEntries.push([
      dayOfWeek,
      slots.map((slot) => `${slot.startTime}–${slot.endTime}`).join(", "),
    ])
  }

  return {
    summaries: Object.fromEntries(summaryEntries),
    slots: Object.fromEntries(slotEntries),
    hasAssigned: summaryEntries.length > 0,
  }
}
