import type { ISchedule, IScheduleDay } from "@/types/attendance.types"
import { getCycleWeekIndex } from "@/utils/attendance/get-cycle-week-index"

/** Resolves the schedule day for a calendar date, including rotating multi-week cycles. */
export function resolveScheduleDay(
  schedule: ISchedule | null | undefined,
  date: Date,
): IScheduleDay | undefined {
  if (!schedule?.days?.length) return undefined

  const cycleWeeks = schedule.cycleWeeks ?? 1
  const weekIndex =
    cycleWeeks > 1 && schedule.validFrom
      ? getCycleWeekIndex(date, new Date(schedule.validFrom), cycleWeeks)
      : 0

  return schedule.days.find(
    (item) => item.dayOfWeek === date.getDay() && (item.weekIndex ?? 0) === weekIndex,
  )
}
