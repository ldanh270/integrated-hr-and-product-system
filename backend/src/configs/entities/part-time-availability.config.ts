export const PART_TIME_AVAILABILITY_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const

/** Lifecycle: draft → submitted → approved|rejected. Assign allowed when submitted (approval optional). */
export const PART_TIME_AVAILABILITY_STATUSES = [
  PART_TIME_AVAILABILITY_STATUS.DRAFT,
  PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
  PART_TIME_AVAILABILITY_STATUS.APPROVED,
  PART_TIME_AVAILABILITY_STATUS.REJECTED,
] as const

export type IPartTimeAvailabilityStatus = (typeof PART_TIME_AVAILABILITY_STATUSES)[number]

import { parseTimeToMinutes } from "@/utils/part-time-availability.util.ts"

/** Slot grid constraints — aligned with UI 30-min stepper and overlap validation in service. */
export const PART_TIME_AVAILABILITY_RULES = {
  MAX_SLOTS_PER_DAY: 4,
  MIN_SLOT_DURATION_MINUTES: 30,
  TIME_STEP_MINUTES: 30,
  DEFAULT_SLOT_START: "08:00",
  DEFAULT_SLOT_END: "17:00",
  DEFAULT_SLOT_START_MINUTES: parseTimeToMinutes("08:00"),
  DEFAULT_SLOT_END_MINUTES: parseTimeToMinutes("17:00"),
} as const

export const PART_TIME_AVAILABILITY_QUERY_PARAMS = {
  WEEK_START: "weekStart",
} as const
