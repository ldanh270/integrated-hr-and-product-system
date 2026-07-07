import { getWeekStart } from "@/utils/attendance/get-week-start"
import {
  PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES,
  PART_TIME_AVAILABILITY_EDITABLE_STATUSES,
  type IPartTimeAvailabilityStatus,
} from "@/config/entities/part-time-availability.config"

export function getEarliestRequestableWeekStart(referenceDate = new Date()): Date {
  const currentWeekStart = getWeekStart(referenceDate)
  const nextWeekStart = new Date(currentWeekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)
  return nextWeekStart
}

export function clampToEarliestRequestableWeek(
  weekStart: Date,
  referenceDate = new Date(),
): Date {
  const normalized = getWeekStart(weekStart)
  const earliest = getEarliestRequestableWeekStart(referenceDate)
  // Employees may only declare from next Monday onward — block navigating into past/current week.
  return normalized.getTime() < earliest.getTime() ? earliest : normalized
}

export function isPartTimeAvailabilityEditable(
  status: IPartTimeAvailabilityStatus | null | undefined,
): boolean {
  // Intended gate for draft/submitted/rejected; UI keeps form open after submit because assign needs no approval.
  // No saved row yet — first submit is always allowed for the target week.
  if (!status) return true
  return PART_TIME_AVAILABILITY_EDITABLE_STATUSES.includes(status)
}

export function isPartTimeAvailabilityAssignable(
  status: IPartTimeAvailabilityStatus | null | undefined,
): boolean {
  if (!status) return false
  return PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES.includes(status)
}
