import { minutesToTime } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"

/**
 * Derives min/max time-picker bounds from all slots on a day for constrained admin assign inputs.
 */
export function getAvailabilityTimeEnvelope(
  day: IPartTimeAvailabilityDay | undefined,
): { min: string; max: string } | null {
  if (!day || day.isBusyAllDay || day.slots.length === 0) return null

  const starts = day.slots.map((slot) => slot.startTime)
  const ends = day.slots.map((slot) => slot.endTime)

  return {
    min: minutesToTime(Math.min(...starts)),
    max: minutesToTime(Math.max(...ends)),
  }
}
