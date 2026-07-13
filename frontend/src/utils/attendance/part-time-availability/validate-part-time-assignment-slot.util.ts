import { PART_TIME_AVAILABILITY_ASSIGN_VALIDATION } from "@/config/entities/part-time-availability.config"
import { timeToMinutes } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"

import { shiftFitsAvailabilityDay } from "./shift-fits-availability-day.util"

/**
 * Validates a single admin-assigned slot against completeness, ordering, and employee free-range rules.
 */
export function validatePartTimeAssignmentSlot(
  startTime: string | null,
  endTime: string | null,
  day: IPartTimeAvailabilityDay | undefined,
): string | null {
  if (!startTime && !endTime) return null
  if (!startTime || !endTime) return PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.INCOMPLETE

  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (startMinutes >= endMinutes) return PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.END_BEFORE_START

  if (!shiftFitsAvailabilityDay({ startTime: startMinutes, endTime: endMinutes }, day)) {
    return PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.OUTSIDE_FREE_RANGE
  }

  return null
}
