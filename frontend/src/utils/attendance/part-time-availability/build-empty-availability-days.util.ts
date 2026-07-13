import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import { PART_TIME_AVAILABILITY_RULES } from "@/config/entities/part-time-availability.config"
import type { IPartTimeAvailabilityDayForm } from "@/types/part-time-availability.types"

/**
 * Provides editable default slots for every weekday when no saved availability exists yet.
 */
export function buildEmptyAvailabilityDays(): IPartTimeAvailabilityDayForm[] {
  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => ({
    dayOfWeek,
    isBusyAllDay: false,
    slots: [
      {
        startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
        endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
      },
    ],
  }))
}
