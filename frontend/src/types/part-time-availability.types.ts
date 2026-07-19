/** Frontend DTOs for part-time weekly availability forms and assign payloads. */
import type { IPartTimeAvailabilityStatus } from "@/config/entities/part-time-availability.config"

export interface IPartTimeAvailabilitySlotForm {
  startTime: string
  endTime: string
}

export interface IPartTimeAvailabilityDayForm {
  dayOfWeek: number
  /** When true, employee is unavailable all day — no shift may be assigned. */
  isBusyAllDay: boolean
  slots: IPartTimeAvailabilitySlotForm[]
}

export interface IPartTimeAvailabilitySlot {
  id?: string
  startTime: number
  endTime: number
  sortOrder: number
}

export interface IPartTimeAvailabilityDay {
  id?: string
  dayOfWeek: number
  isBusyAllDay: boolean
  slots: IPartTimeAvailabilitySlot[]
}

export interface IPartTimeWeeklyAvailability {
  id: string
  employeeId: string
  weekStart: string
  /** Gates employee edits; admin assign requires submitted (or legacy approved), not approval. */
  status: IPartTimeAvailabilityStatus
  note: string | null
  submittedAt: string | null
  reviewedById: string | null
  reviewedAt: string | null
  rejectReason: string | null
  createdAt: string
  updatedAt: string
  days: IPartTimeAvailabilityDay[]
  assignedDaySummaries?: Partial<Record<number, string>>
  hasAssignedShifts?: boolean
  employee?: {
    id: string
    fullName: string
    email: string
    employeeType: string
    workScheduleType?: string | null
  }
}

export interface IUpsertPartTimeAvailabilityPayload {
  weekStart: string
  note?: string | null
  status?: IPartTimeAvailabilityStatus
  days: IPartTimeAvailabilityDayForm[]
}

export interface IAssignPartTimeShiftsPayload {
  /** Null start/end means admin marks the day as off (no shift). */
  assignments: Array<{ dayOfWeek: number; startTime: string | null; endTime: string | null }>
  suggestionDecision?: "accepted" | "edited" | "manual"
}

export interface IAssignPartTimeShiftsResult {
  assigned: number
  skipped: number
}

export interface ISuggestPartTimeAssignment {
  shiftId: string
  shiftName: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface ISuggestPartTimeEmployeeSuggestion {
  availabilityId: string
  employeeId: string
  employeeName: string
  score: number
  reasons: string[]
  assignments: ISuggestPartTimeAssignment[]
}

export interface ISuggestPartTimeCoverage {
  shiftId: string
  shiftName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  requiredCount: number
  assignedCount: number
  coverageScore: number
}

export interface IPartTimeUnassignedGap {
  shiftId: string
  shiftName: string
  dayOfWeek: number
  missingCount: number
  reason: string
}

export interface ISuggestPartTimeShiftsResult {
  weekStart: string
  suggestions: ISuggestPartTimeEmployeeSuggestion[]
  coverage: ISuggestPartTimeCoverage[]
  unassignedGaps: IPartTimeUnassignedGap[]
}

export interface IPartTimeCoverageRequirement {
  shiftId: string
  dayOfWeek: number
  startTime: number
  endTime: number
  requiredCount: number
}
