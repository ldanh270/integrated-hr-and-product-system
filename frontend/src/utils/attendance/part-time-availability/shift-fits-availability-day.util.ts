import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"

import { isOvernightShift } from "./is-overnight-shift.util"

/**
 * Ensures an assigned shift sits fully inside at least one employee-declared free window for that day.
 */
export function shiftFitsAvailabilityDay(
  shift: { startTime: number; endTime: number },
  day: IPartTimeAvailabilityDay | undefined,
): boolean {
  if (!day || day.isBusyAllDay || day.slots.length === 0) return false
  if (isOvernightShift(shift)) return false

  return day.slots.some(
    (slot) => shift.startTime >= slot.startTime && shift.endTime <= slot.endTime,
  )
}
