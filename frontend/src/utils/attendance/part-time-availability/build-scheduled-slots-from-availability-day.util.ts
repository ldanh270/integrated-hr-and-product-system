import { PART_TIME_AVAILABILITY_RULES } from "@/config/entities/part-time-availability.config"
import { minutesToTime } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"

import type { IPartTimeAssignmentSlotForm } from "./part-time-assignment-form.types"

/**
 * Seeds a default assign window when the employee left a day empty so admin assign UI is never blocked.
 */
export function buildScheduledSlotsFromAvailabilityDay(
  day: IPartTimeAvailabilityDay | undefined,
): IPartTimeAssignmentSlotForm[] {
  if (!day || day.isBusyAllDay || day.slots.length === 0) {
    return [
      {
        startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
        endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
      },
    ]
  }

  return day.slots.map((slot) => ({
    startTime: minutesToTime(slot.startTime),
    endTime: minutesToTime(slot.endTime),
  }))
}
