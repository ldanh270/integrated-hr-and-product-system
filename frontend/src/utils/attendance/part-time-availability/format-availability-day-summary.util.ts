import { minutesToTime } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"

/**
 * Produces a compact Vietnamese summary of one day's availability for list and card displays.
 */
export function formatAvailabilityDaySummary(day: IPartTimeAvailabilityDay | undefined): string {
  if (!day || day.isBusyAllDay) return "Bận cả ngày"
  if (day.slots.length === 0) return "Chưa khai báo"

  return day.slots
    .map((slot) => `${minutesToTime(slot.startTime)}–${minutesToTime(slot.endTime)}`)
    .join(", ")
}
