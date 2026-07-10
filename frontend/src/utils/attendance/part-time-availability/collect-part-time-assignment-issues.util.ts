import { PART_TIME_AVAILABILITY_ASSIGN_VALIDATION } from "@/config/entities/part-time-availability.config"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"

import { buildOutsideFreeRangeAlert } from "./build-outside-free-range-alert.util"
import type { IPartTimeAssignmentDayForm } from "./part-time-assignment-form.types"
import { validatePartTimeAssignmentSlot } from "./validate-part-time-assignment-slot.util"

/**
 * Collects admin assign validation errors across scheduled days, skipping busy days with zero availability.
 */
export function collectPartTimeAssignmentIssues(
  assignments: IPartTimeAssignmentDayForm[],
  dayMap: Map<number, IPartTimeAvailabilityDay>,
  dayLabels: Map<number, string>,
): string[] {
  return assignments.flatMap((assignment) => {
    if (!assignment.isScheduled) return []

    const day = dayMap.get(assignment.dayOfWeek)
    if (day?.isBusyAllDay) return []

    const dayLabel = dayLabels.get(assignment.dayOfWeek) ?? `Ngày ${assignment.dayOfWeek}`

    return assignment.slots.flatMap((slot) => {
      const error = validatePartTimeAssignmentSlot(slot.startTime, slot.endTime, day)
      if (!error) return []

      if (error === PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.OUTSIDE_FREE_RANGE) {
        return [buildOutsideFreeRangeAlert(dayLabel, day)]
      }

      return [`${dayLabel}: ${error}`]
    })
  })
}
