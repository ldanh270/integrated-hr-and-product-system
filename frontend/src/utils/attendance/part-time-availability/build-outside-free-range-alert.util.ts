import { PART_TIME_AVAILABILITY_ASSIGN_VALIDATION } from "@/config/entities/part-time-availability.config"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"

import { formatAvailabilityRangesForAssign } from "./format-availability-ranges-for-assign.util"

/**
 * Builds a user-readable alert that names the day and lists allowed ranges when assign exceeds availability.
 */
export function buildOutsideFreeRangeAlert(
  dayLabel: string,
  availabilityDay: IPartTimeAvailabilityDay | undefined,
): string {
  const ranges = formatAvailabilityRangesForAssign(availabilityDay)
  return ranges
    ? `${dayLabel}: ${PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.OUTSIDE_FREE_RANGE} (${ranges})`
    : `${dayLabel}: ${PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.OUTSIDE_FREE_RANGE}`
}
