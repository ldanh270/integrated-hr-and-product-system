import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import {
  PART_TIME_AVAILABILITY_ASSIGN_VALIDATION,
  PART_TIME_AVAILABILITY_RULES,
} from "@/config/entities/part-time-availability.config"
import { minutesToTime, timeToMinutes } from "@/lib/utils"
import type {
  IPartTimeAvailabilityDay,
  IPartTimeAvailabilityDayForm,
  IPartTimeWeeklyAvailability,
} from "@/types/part-time-availability.types"

export interface IPartTimeAssignmentSlotForm {
  startTime: string | null
  endTime: string | null
}

export interface IPartTimeAssignmentDayForm {
  dayOfWeek: number
  isScheduled: boolean
  slots: IPartTimeAssignmentSlotForm[]
}

export interface IPartTimeAssignmentForm {
  dayOfWeek: number
  startTime: string | null
  endTime: string | null
}

export function buildScheduledSlotsFromAvailabilityDay(
  day: IPartTimeAvailabilityDay | undefined,
): IPartTimeAssignmentSlotForm[] {
  // Free day with no slots → seed default window so admin assign is not blocked on empty UI.
  if (!day || day.isBusyAllDay || day.slots.length === 0) {
    return [
      {
        startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
        endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
      },
    ]
  }

  return day.slots.map((slot) => ({
    startTime: minutesToTime(slot.startTime),
    endTime: minutesToTime(slot.endTime),
  }))
}

export function buildDefaultPartTimeAssignments(
  availability: IPartTimeWeeklyAvailability,
): IPartTimeAssignmentDayForm[] {
  const dayMap = new Map(availability.days.map((day) => [day.dayOfWeek, day]))

  // Busy days start unscheduled so admin explicitly opts in; free days pre-fill from employee slots.
  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
    const day = dayMap.get(dayOfWeek)
    const isBusyDay = Boolean(day?.isBusyAllDay)

    if (isBusyDay) {
      return { dayOfWeek, isScheduled: false, slots: [] }
    }

    return {
      dayOfWeek,
      isScheduled: true,
      slots: buildScheduledSlotsFromAvailabilityDay(day),
    }
  })
}

export function flattenPartTimeAssignments(
  days: IPartTimeAssignmentDayForm[],
): IPartTimeAssignmentForm[] {
  return days.flatMap((day) => {
    // Off day → omit from API payload; partial empty slot → skip (not a valid shift).
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

export function formatAvailabilityRangesForAssign(
  day: IPartTimeAvailabilityDay | undefined,
): string {
  if (!day || day.isBusyAllDay || day.slots.length === 0) return ""

  return day.slots
    .map((slot) => `${minutesToTime(slot.startTime)}–${minutesToTime(slot.endTime)}`)
    .join(", ")
}

export function getAvailabilityTimeEnvelope(
  day: IPartTimeAvailabilityDay | undefined,
): { min: string; max: string } | null {
  if (!day || day.isBusyAllDay || day.slots.length === 0) return null

  const starts = day.slots.map((slot) => slot.startTime)
  const ends = day.slots.map((slot) => slot.endTime)

  return {
    min: minutesToTime(Math.min(...starts)),
    max: minutesToTime(Math.max(...ends)),
  }
}

export function validatePartTimeAssignmentSlot(
  startTime: string | null,
  endTime: string | null,
  day: IPartTimeAvailabilityDay | undefined,
): string | null {
  // Both empty = day off for assign; one-sided input is invalid, not skipped.
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

export function buildOutsideFreeRangeAlert(
  dayLabel: string,
  availabilityDay: IPartTimeAvailabilityDay | undefined,
): string {
  const ranges = formatAvailabilityRangesForAssign(availabilityDay)
  return ranges
    ? `${dayLabel}: ${PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.OUTSIDE_FREE_RANGE} (${ranges})`
    : `${dayLabel}: ${PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.OUTSIDE_FREE_RANGE}`
}

export function collectPartTimeAssignmentIssues(
  assignments: IPartTimeAssignmentDayForm[],
  dayMap: Map<number, IPartTimeAvailabilityDay>,
  dayLabels: Map<number, string>,
): string[] {
  return assignments.flatMap((assignment) => {
    if (!assignment.isScheduled) return []

    const day = dayMap.get(assignment.dayOfWeek)
    // Busy-all-day = zero availability; no shift possible — skip validation noise.
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

export function isOvernightShift(shift: { startTime: number; endTime: number }): boolean {
  return shift.endTime < shift.startTime
}

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

export function buildEmptyAvailabilityDays(): IPartTimeAvailabilityDayForm[] {
  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => ({
    dayOfWeek,
    isBusyAllDay: false,
    slots: [
      {
        startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
        endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
      },
    ],
  }))
}

export function mapAvailabilityToForm(
  availability: IPartTimeWeeklyAvailability | null | undefined,
): IPartTimeAvailabilityDayForm[] {
  if (!availability) return buildEmptyAvailabilityDays()

  const byDay = new Map(availability.days.map((day) => [day.dayOfWeek, day]))

  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
    const day = byDay.get(dayOfWeek)
    // Missing weekday in DB → editable default slot (employee has not declared that day yet).
    if (!day) {
      return {
        dayOfWeek,
        isBusyAllDay: false,
        slots: [
          {
            startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
            endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
          },
        ],
      }
    }

    return {
      dayOfWeek,
      isBusyAllDay: day.isBusyAllDay,
      slots: day.isBusyAllDay
        ? []
        : day.slots.map((slot) => ({
            startTime: minutesToTime(slot.startTime),
            endTime: minutesToTime(slot.endTime),
          })),
    }
  })
}

export function formatAvailabilityDaySummary(day: IPartTimeAvailabilityDay | undefined): string {
  if (!day || day.isBusyAllDay) return "Bận cả ngày"
  if (day.slots.length === 0) return "Chưa khai báo"

  return day.slots
    .map((slot) => `${minutesToTime(slot.startTime)}–${minutesToTime(slot.endTime)}`)
    .join(", ")
}
