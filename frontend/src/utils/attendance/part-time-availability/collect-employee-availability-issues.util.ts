import {
  PART_TIME_AVAILABILITY_ASSIGN_VALIDATION,
  PART_TIME_AVAILABILITY_FORM_VALIDATION,
  PART_TIME_AVAILABILITY_RULES,
} from "@/config/entities/part-time-availability.config"
import { timeToMinutes } from "@/lib/utils"
import type { IPartTimeAvailabilityDayForm } from "@/types/part-time-availability.types"

/**
 * Aggregates employee-side form validation issues before submit (busy/slot conflicts, overlap, duration).
 */
export function collectEmployeeAvailabilityIssues(
  days: IPartTimeAvailabilityDayForm[],
  dayLabels: Map<number, string>,
): string[] {
  return days.flatMap((day) => {
    const dayLabel = dayLabels.get(day.dayOfWeek) ?? `Ngày ${day.dayOfWeek}`
    const issues: string[] = []

    if (day.isBusyAllDay && day.slots.length > 0) {
      issues.push(`${dayLabel}: ${PART_TIME_AVAILABILITY_FORM_VALIDATION.BUSY_WITH_SLOTS}`)
    }

    if (!day.isBusyAllDay && day.slots.length === 0) {
      issues.push(`${dayLabel}: ${PART_TIME_AVAILABILITY_FORM_VALIDATION.EMPTY_DAY_SLOTS}`)
    }

    if (day.slots.length > PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY) {
      issues.push(`${dayLabel}: ${PART_TIME_AVAILABILITY_FORM_VALIDATION.MAX_SLOTS}`)
    }

    const sorted = [...day.slots]
      .map((slot) => ({
        startMinutes: slot.startTime ? timeToMinutes(slot.startTime) : null,
        endMinutes: slot.endTime ? timeToMinutes(slot.endTime) : null,
      }))
      .filter(
        (slot): slot is { startMinutes: number; endMinutes: number } =>
          slot.startMinutes !== null && slot.endMinutes !== null,
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)

    let previousEnd: number | null = null
    for (const slot of sorted) {
      if (slot.startMinutes >= slot.endMinutes) {
        issues.push(`${dayLabel}: ${PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.END_BEFORE_START}`)
        continue
      }

      if (
        slot.endMinutes - slot.startMinutes <
        PART_TIME_AVAILABILITY_RULES.MIN_SLOT_DURATION_MINUTES
      ) {
        issues.push(`${dayLabel}: ${PART_TIME_AVAILABILITY_FORM_VALIDATION.SLOT_TOO_SHORT}`)
      }

      if (previousEnd !== null && slot.startMinutes < previousEnd) {
        issues.push(`${dayLabel}: ${PART_TIME_AVAILABILITY_FORM_VALIDATION.SLOT_OVERLAP}`)
      }

      previousEnd = slot.endMinutes
    }

    return issues
  })
}
