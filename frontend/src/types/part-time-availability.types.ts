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
}

export interface IAssignPartTimeShiftsResult {
  assigned: number
  skipped: number
}
