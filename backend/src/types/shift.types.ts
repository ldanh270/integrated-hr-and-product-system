import type { IEmployeeShiftStatus } from "@/configs/entities/attendance.config.ts"
import type {
  IShiftScheduleWithDays,
  IShiftScheduleWithTemplate,
} from "@/types/shift-schedule.types.ts"

import type { Prisma, WorkingShift } from "@prisma/client"

export type IEmployeeShiftWithShift = Prisma.EmployeeShiftGetPayload<{
  include: { shift: true }
}>

export interface IGpsLocationDTO {
  lat: number
  lng: number
  radiusMeters?: number
}

// ─── WORKING SHIFT (Template) ──────────────────────────────────
export interface ICreateWorkingShiftDTO {
  name: string
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
  /** Optional unpaid break. Both fields must be set together and remain inside the shift. */
  breakStartTime?: string | null
  breakEndTime?: string | null
  gracePeriodMinutes?: number
  /** null on PATCH removes geofence; optional on create. */
  gps?: IGpsLocationDTO | null
  isActive?: boolean
  createdById: string
}

export interface IUpdateWorkingShiftDTO extends Partial<ICreateWorkingShiftDTO> {}

// ─── SHIFT SCHEDULE (Weekly Pattern) ──────────────────────────
export interface IAssignShiftScheduleDTO {
  employeeId: string
  validFrom: string | Date
  validTo?: string | Date | null
  createdById: string
  templateId?: string
  cycleWeeks?: number
  days?: {
    dayOfWeek: number
    weekIndex?: number
    shiftId: string
  }[]
}

// ─── SHIFT CHANGE REQUEST ──────────────────────────────────────
export interface ISubmitShiftChangeRequestDTO {
  employeeId: string
  reason: string
  startDate: string | Date
  endDate?: string | Date
  employeeShiftId: string // Shift the employee wants to swap FROM
  swapWithEmployeeId: string // Target employee to swap WITH
  swapWithShiftId: string // Target EmployeeShift to swap WITH
  workingShiftId?: string // Target WorkingShift template (optional)
}

/**
 * Repository for managing shift change requests.
 */
export interface IShiftChangeRequestRepository {
  /** Submits a new shift change request. */
  submit(data: ISubmitShiftChangeRequestDTO): Promise<unknown>
  /** Finds requests by employee ID. */
  findByEmployee(employeeId: string): Promise<unknown[]>
  /** Finds a request by ID. */
  findById(id: string): Promise<unknown | null>
  /** Lists all pending requests. */
  listPending(): Promise<unknown[]>
}

/**
 * Service for managing shift change requests.
 */
export interface IShiftChangeRequestService {
  /** Submits a request. */
  submitRequest(data: ISubmitShiftChangeRequestDTO): Promise<unknown>
  /** Gets requests for the current employee. */
  getMyRequests(employeeId: string): Promise<unknown[]>
}

// ─── EMPLOYEE SHIFT (Daily Record Override) ───────────────────
export interface IOverrideEmployeeShiftDTO {
  employeeId: string
  shiftId: string
  assignedDate: string | Date
  /** Audit who assigned — set when admin materializes PT availability into shifts. */
  createdById?: string
}

/** Explicit row shape for override create/update — avoids unresolved Prisma types in Codacy. */
export interface IEmployeeShiftOverrideRecord {
  id: string
  employeeId: string
  shiftId: string
  assignedDate: Date
  scheduleId: string | null
  status: IEmployeeShiftStatus
  isOverride: boolean
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export type ShiftGenerateItemStatus = "pending" | "existing" | "override" | "no_schedule"

export interface IGenerateShiftsDTO {
  employeeIds: string[]
  startDate: string | Date
  endDate: string | Date
  createdById?: string
}

export interface IGeneratedShiftPreviewItem {
  date: string
  shiftId: string | null
  shift?: {
    id?: string
    name?: string
    startTime: number
    endTime: number
    breakStartTime?: number | null
    breakEndTime?: number | null
  } | null
  status: ShiftGenerateItemStatus
}

export interface IGeneratedShiftPreview {
  employeeId: string
  items: IGeneratedShiftPreviewItem[]
}

export interface IGenerateShiftsResult {
  created: number
  updated: number
  skipped: number
}

export interface IPlannedWeekShift {
  shiftId: string
  isOverride: boolean
  shift: {
    id: string
    name: string
    startTime: number
    endTime: number
    gracePeriodMinutes: number
    gpsLat: number | null
    gpsLng: number | null
    gpsRadiusMeters: number | null
  }
}

export interface IPlannedWeekDay {
  date: string
  dayOfWeek: number
  shifts: IPlannedWeekShift[]
}

export interface IPlannedWeek {
  weekStart: string
  days: IPlannedWeekDay[]
}

// ─── REPOSITORY INTERFACES ────────────────────────────────────
/**
 * Repository for working shift definitions.
 */
export interface IWorkingShiftRepository {
  /** Creates a shift. */
  create(data: ICreateWorkingShiftDTO): Promise<WorkingShift>
  /** Updates a shift. */
  update(id: string, data: IUpdateWorkingShiftDTO): Promise<WorkingShift | null>
  /** Finds shift by ID. */
  findById(id: string): Promise<WorkingShift | null>
  /** Lists all shifts. */
  listAll(): Promise<WorkingShift[]>
  /** Deletes a shift. */
  delete(id: string): Promise<void>
}

/**
 * Repository for shift schedules (weekly patterns).
 */
export interface IShiftScheduleRepository {
  /** Assigns a pattern to an employee. */
  assignSchedule(data: IAssignShiftScheduleDTO): Promise<IShiftScheduleWithTemplate>
  /** Gets the active pattern for a date. */
  getScheduleByEmployee(
    employeeId: string,
    date: string | Date,
  ): Promise<IShiftScheduleWithDays | null>
  /** Lists patterns for an employee. */
  listSchedulesByEmployee(employeeId: string): Promise<IShiftScheduleWithDays[]>
  /** Employee IDs with an active template-based schedule on a date. */
  findEmployeeIdsWithActiveTemplateSchedule(date: Date): Promise<string[]>
}

/**
 * Repository for daily employee shift records.
 */
export interface IEmployeeShiftRepository {
  /** Overrides a shift for a specific date. */
  overrideShift(data: IOverrideEmployeeShiftDTO): Promise<IEmployeeShiftOverrideRecord>
  createOverrideShift(data: IOverrideEmployeeShiftDTO): Promise<IEmployeeShiftOverrideRecord>
  deleteOverridesForEmployeeDates(employeeId: string, dates: Date[]): Promise<void>
  hasOverridesForEmployeeDates(employeeId: string, dates: Date[]): Promise<boolean>
  replacePartTimeOverrides(
    employeeId: string,
    dates: Date[],
    overrides: IOverrideEmployeeShiftDTO[],
  ): Promise<void>
  /** Gets shift for employee on date; atMinutes picks matching window for multi-slot PT days. */
  getShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
    options?: { atMinutes?: number },
  ): Promise<IEmployeeShiftWithShift | null>
  /** Lists shifts for multiple employees within a date range. */
  listByEmployeesAndDateRange(
    employeeIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<IEmployeeShiftWithShift[]>
  /** Creates or updates a generated shift; skips manual overrides. */
  generateShiftForDate(
    employeeId: string,
    date: Date,
    shiftId: string,
    scheduleId: string | null,
    createdById: string,
  ): Promise<"created" | "updated" | "skipped">
  /** Ensures a record exists for employee on date. */
  ensureShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
    shiftId: string,
    createdById: string,
  ): Promise<IEmployeeShiftWithShift>
}

// ─── SERVICE INTERFACES ───────────────────────────────────────
/**
 * Service for working shifts.
 */
export interface IShiftService {
  /** Creates a shift. */
  createShift(data: ICreateWorkingShiftDTO): Promise<WorkingShift>
  /** Updates a shift. */
  updateShift(id: string, data: IUpdateWorkingShiftDTO): Promise<WorkingShift | null>
  /** Deletes a shift. */
  deleteShift(id: string): Promise<void>
  /** Gets shift by ID. */
  getShift(id: string): Promise<WorkingShift | null>
  /** Lists all shifts. */
  listShifts(): Promise<WorkingShift[]>
}

/**
 * Service for shift scheduling.
 */
export interface IScheduleService {
  /** Assigns a schedule pattern. */
  assignSchedule(data: IAssignShiftScheduleDTO): Promise<IShiftScheduleWithTemplate>
  /** Gets schedule for a specific date. */
  getScheduleForEmployee(
    employeeId: string,
    date: string | Date,
  ): Promise<IShiftScheduleWithDays | null>
  /** Lists schedules for an employee. */
  listSchedulesForEmployee(employeeId: string): Promise<IShiftScheduleWithDays[]>

  getEmployeeShifts(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<IEmployeeShiftWithShift[]>

  /** Overrides shift for a date. */
  overrideEmployeeShift(data: IOverrideEmployeeShiftDTO): Promise<unknown>
  /** Previews shifts that would be generated for a date range. */
  previewGeneratedShifts(data: IGenerateShiftsDTO): Promise<IGeneratedShiftPreview[]>
  /** Materializes planned shifts into EmployeeShift records. */
  generateShifts(data: IGenerateShiftsDTO): Promise<IGenerateShiftsResult>
  /** Week view merging EmployeeShift overrides with template fallback. */
  getPlannedWeekForEmployee(employeeId: string, weekStart: string | Date): Promise<IPlannedWeek>
}

// ─── SCHEDULE INSIGHTS (Weekly Schedule Copilot Mode A) ────────

export interface IScheduleInsightDayBucket {
  dayOfWeek: number
  label: string
  total: number
  late: number
  absent: number
  onTime: number
  lateRate: number
  absentRate: number
  avgLateMinutes: number
}

export interface IScheduleInsightHotspot {
  dayOfWeek: number
  issue: "late" | "absent"
  rate: number
  message: string
}

export interface IScheduleInsightsResult {
  lookbackDays: number
  periodStart: string
  periodEnd: string
  employeeCount: number
  totals: {
    late: number
    absent: number
    onTime: number
    avgLateMinutes: number
  }
  byDayOfWeek: IScheduleInsightDayBucket[]
  hotspots: IScheduleInsightHotspot[]
}

export interface IScheduleInsightsService {
  getInsights(lookbackDays?: number): Promise<IScheduleInsightsResult>
  suggestTemplates(lookbackDays?: number): Promise<ISuggestWeeklyTemplatesResult>
  simulateTemplate(draft: ISimulateWeeklyTemplateDraft): Promise<ISimulateWeeklyTemplateResult>
}

export interface ISuggestedTemplateDay {
  dayOfWeek: number
  shiftId: string | null
  shiftName: string | null
}

export interface ISuggestedTemplateWeek {
  weekIndex: number
  days: ISuggestedTemplateDay[]
}

export interface ISuggestedWeeklyTemplateCandidate {
  id: string
  name: string
  description: string
  cycleWeeks: number
  predictedCoverageScore: number
  tradeOffs: string[]
  weeks: ISuggestedTemplateWeek[]
}

export interface ISuggestWeeklyTemplatesResult {
  lookbackDays: number
  basedOnInsights: {
    employeeCount: number
    periodStart: string
    periodEnd: string
  }
  candidates: ISuggestedWeeklyTemplateCandidate[]
}

export interface ISimulateWeeklyTemplateDraft {
  cycleWeeks: number
  weeks: Array<{
    weekIndex: number
    days: Array<{ dayOfWeek: number; shiftId: string | null }>
  }>
  lookbackDays?: number
  simulateWeeks?: number
}

export interface ISimulateWeeklyTemplateDayImpact {
  dayOfWeek: number
  label: string
  assignedShifts: number
  historicalLateRate: number
  historicalAbsentRate: number
  projectedLateRisk: number
  projectedAbsentRisk: number
  note: string
}

export interface ISimulateWeeklyTemplateResult {
  simulateWeeks: number
  lookbackDays: number
  summary: {
    totalAssignedSlots: number
    offSlots: number
    avgProjectedLateRisk: number
    avgProjectedAbsentRisk: number
  }
  byDayOfWeek: ISimulateWeeklyTemplateDayImpact[]
  messages: string[]
}
