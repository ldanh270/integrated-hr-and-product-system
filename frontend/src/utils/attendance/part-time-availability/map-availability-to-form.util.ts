import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import { PART_TIME_AVAILABILITY_RULES } from "@/config/entities/part-time-availability.config"
import { minutesToTime } from "@/lib/utils"
import type {
  IPartTimeAvailabilityDayForm,
  IPartTimeWeeklyAvailability,
} from "@/types/part-time-availability.types"

import { buildEmptyAvailabilityDays } from "./build-empty-availability-days.util"

/**
 * Maps API weekly availability into form-friendly time strings, filling defaults for undeclared weekdays.
 */
export function mapAvailabilityToForm(
  availability: IPartTimeWeeklyAvailability | null | undefined,
): IPartTimeAvailabilityDayForm[] {
  if (!availability) return buildEmptyAvailabilityDays()

  const byDay = new Map(availability.days.map((day) => [day.dayOfWeek, day]))

  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
    const day = byDay.get(dayOfWeek)
    if (!day) {
      return {
        dayOfWeek,
        isBusyAllDay: false,
        slots: [
          {
            startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
            endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
          },
        ],
      }
    }

    return {
      dayOfWeek,
      isBusyAllDay: day.isBusyAllDay,
      slots: day.isBusyAllDay
        ? []
        : day.slots.map((slot) => ({
            startTime: minutesToTime(slot.startTime),
            endTime: minutesToTime(slot.endTime),
          })),
    }
  })
}
