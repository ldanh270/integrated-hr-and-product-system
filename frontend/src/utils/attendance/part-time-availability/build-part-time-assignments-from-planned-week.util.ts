/**
 * Converts a previously planned attendance week into an editable part-time assignment form.
 * Only slots still allowed by the employee's submitted availability are retained.
 */
import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import type { IPlannedWeek } from "@/types/attendance.types"
import type { IPartTimeWeeklyAvailability } from "@/types/part-time-availability.types"
import { minutesToTime } from "@/lib/utils"
import { buildScheduledSlotsFromAvailabilityDay } from "@/utils/attendance/part-time-availability/build-scheduled-slots-from-availability-day.util"
import type { IPartTimeAssignmentDayForm } from "@/utils/attendance/part-time-availability/part-time-assignment-form.types"

/**
 * Pre-fills the admin assign form for one PT employee.
 *
 * Priority order per day:
 * 1. Existing admin override shifts for that day (isOverride=true) — preserves manual edits.
 * 2. Scheduled slots derived from the employee's availability declaration.
 * 3. Busy all day → unscheduled (no slots, isScheduled=false).
 */
export function buildPartTimeAssignmentsFromPlannedWeek(
  availability: IPartTimeWeeklyAvailability,
  plannedWeek?: IPlannedWeek | null,
): IPartTimeAssignmentDayForm[] {
  const dayMap = new Map(availability.days.map((day) => [day.dayOfWeek, day]))
  const plannedByDay = new Map(plannedWeek?.days.map((day) => [day.dayOfWeek, day]) ?? [])

  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
    const availabilityDay = dayMap.get(dayOfWeek)
    const isBusyDay = Boolean(availabilityDay?.isBusyAllDay)
    const plannedDay = plannedByDay.get(dayOfWeek)
    const overrideShifts = plannedDay?.shifts.filter((shift) => shift.isOverride) ?? []

    if (isBusyDay) {
      return { dayOfWeek, isScheduled: false, slots: [] }
    }

    if (overrideShifts.length > 0) {
      return {
        dayOfWeek,
        isScheduled: true,
        slots: overrideShifts.map((entry) => ({
          startTime: minutesToTime(entry.shift.startTime),
          endTime: minutesToTime(entry.shift.endTime),
        })),
      }
    }

    return {
      dayOfWeek,
      isScheduled: true,
      slots: buildScheduledSlotsFromAvailabilityDay(availabilityDay),
    }
  })
}
