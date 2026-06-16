import type { IWeeklyScheduleTemplateWeek } from "@/types/attendance.types"

/** Builds empty week/day slots for a new rotating template. */
export function buildEmptyTemplateWeeks(cycleWeeks: number): IWeeklyScheduleTemplateWeek[] {
  return Array.from({ length: cycleWeeks }, (_, weekIndex) => ({
    weekIndex,
    days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      shiftId: null,
    })),
  }))
}
