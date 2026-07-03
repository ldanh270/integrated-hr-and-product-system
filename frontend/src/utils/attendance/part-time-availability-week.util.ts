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
  return normalized.getTime() < earliest.getTime() ? earliest : normalized
}

export function isPartTimeAvailabilityEditable(
  status: IPartTimeAvailabilityStatus | null | undefined,
): boolean {
  if (!status) return true
  return PART_TIME_AVAILABILITY_EDITABLE_STATUSES.includes(status)
}

export function isPartTimeAvailabilityAssignable(
  status: IPartTimeAvailabilityStatus | null | undefined,
): boolean {
  if (!status) return false
  return PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES.includes(status)
}
