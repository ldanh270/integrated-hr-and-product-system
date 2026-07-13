import type {
  IPartTimeAssignmentDayForm,
  IPartTimeAssignmentForm,
} from "./part-time-assignment-form.types"

/**
 * Converts nested day/slot form state into flat API rows, skipping off days and incomplete slots.
 */
export function flattenPartTimeAssignments(
  days: IPartTimeAssignmentDayForm[],
): IPartTimeAssignmentForm[] {
  return days.flatMap((day) => {
    if (!day.isScheduled) return []

    return day.slots
      .filter((slot) => slot.startTime || slot.endTime)
      .map((slot) => ({
        dayOfWeek: day.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))
  })
}
