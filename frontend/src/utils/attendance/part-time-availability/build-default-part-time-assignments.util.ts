import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import type { IPartTimeWeeklyAvailability } from "@/types/part-time-availability.types"

import { buildScheduledSlotsFromAvailabilityDay } from "./build-scheduled-slots-from-availability-day.util"
import type { IPartTimeAssignmentDayForm } from "./part-time-assignment-form.types"

/**
 * Pre-fills the admin assign form: busy days stay off, free days copy employee availability slots.
 */
export function buildDefaultPartTimeAssignments(
  availability: IPartTimeWeeklyAvailability,
): IPartTimeAssignmentDayForm[] {
  const dayMap = new Map(availability.days.map((day) => [day.dayOfWeek, day]))

  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
    const day = dayMap.get(dayOfWeek)
    const isBusyDay = Boolean(day?.isBusyAllDay)

    if (isBusyDay) {
      return { dayOfWeek, isScheduled: false, slots: [] }
    }

    return {
      dayOfWeek,
      isScheduled: true,
      slots: buildScheduledSlotsFromAvailabilityDay(day),
    }
  })
}
