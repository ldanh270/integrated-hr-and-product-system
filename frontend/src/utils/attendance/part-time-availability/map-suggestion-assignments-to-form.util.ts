import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import type { ISuggestPartTimeAssignment } from "@/types/part-time-availability.types"

import type { IPartTimeAssignmentDayForm } from "./part-time-assignment-form.types"

/**
 * Maps API suggestion assignments into the admin assign form shape.
 * Days without a suggested slot become unscheduled (off).
 */
export function mapSuggestionAssignmentsToForm(
  assignments: ISuggestPartTimeAssignment[],
): IPartTimeAssignmentDayForm[] {
  const byDay = new Map<number, ISuggestPartTimeAssignment[]>()

  for (const assignment of assignments) {
    const list = byDay.get(assignment.dayOfWeek) ?? []
    list.push(assignment)
    byDay.set(assignment.dayOfWeek, list)
  }

  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
    const dayAssignments = byDay.get(dayOfWeek) ?? []
    if (dayAssignments.length === 0) {
      return { dayOfWeek, isScheduled: false, slots: [] }
    }

    return {
      dayOfWeek,
      isScheduled: true,
      slots: dayAssignments.map((entry) => ({
        startTime: entry.startTime,
        endTime: entry.endTime,
      })),
    }
  })
}
