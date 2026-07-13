import { minutesToTime } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"

/**
 * Formats employee free windows for admin-facing error messages when a shift falls outside availability.
 */
export function formatAvailabilityRangesForAssign(
  day: IPartTimeAvailabilityDay | undefined,
): string {
  if (!day || day.isBusyAllDay || day.slots.length === 0) return ""

  return day.slots
    .map((slot) => `${minutesToTime(slot.startTime)}–${minutesToTime(slot.endTime)}`)
    .join(", ")
}
