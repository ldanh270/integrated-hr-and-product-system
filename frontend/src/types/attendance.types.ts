import type {
  IApplicationStatus,
  IApplicationType,
  IAttendanceMatrixView,
  IAttendanceStatus,
  ICheckInVarianceStatus,
  IHolidayScope,
  IHolidayType,
} from "@/config/entities/attendance.config"

// ─── GPS ──────────────────────────────────────────────────────

export interface IGpsLocation {
  lat: number
  lng: number
}

export interface IGpsConfig extends IGpsLocation {
  radiusMeters: number
}

// ─── CHECK-IN/OUT ─────────────────────────────────────────────

export interface ICheckInOutRequest {
  location: IGpsLocation
}

// ─── WORKING SHIFT ────────────────────────────────────────────

export interface IWorkingShift {
  id: string
  name: string
  /** Minutes since midnight, e.g. 480 = 08:00 */
  startTime: number
  /** Minutes since midnight, e.g. 1020 = 17:00 */
  endTime: number
  /** Optional unpaid-break bounds in minutes from midnight; null/null means no break. */
  breakStartTime?: number | null
  breakEndTime?: number | null
  gracePeriodMinutes: number
  gpsLat?: number
  gpsLng?: number
  gpsRadiusMeters?: number
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface ICreateShiftPayload {
  name: string
  /** HH:MM format */
  startTime: string
  /** HH:MM format */
  endTime: string
  /** Optional unpaid break; both values must be provided together. */
  breakStartTime?: string | null
  breakEndTime?: string | null
  gracePeriodMinutes?: number
  /** null clears GPS geofence when updating a working shift. */
  gps?: IGpsConfig | null
  isActive?: boolean
}

export type IUpdateShiftPayload = Partial<ICreateShiftPayload>

// ─── SCHEDULE ─────────────────────────────────────────────────

export interface IScheduleDay {
  dayOfWeek: number // 0=Sun, 1=Mon, … 6=Sat
  weekIndex?: number
  shiftId: string
  shift?: Pick<
    IWorkingShift,
    | "name"
    | "startTime"
    | "endTime"
    | "breakStartTime"
    | "breakEndTime"
    | "gracePeriodMinutes"
    | "gpsLat"
    | "gpsLng"
    | "gpsRadiusMeters"
  >
}

export interface ISchedule {
  id: string
  employeeId: string
  validFrom: string
  validTo?: string | null
  templateId?: string | null
  cycleWeeks?: number | null
  days: IScheduleDay[]
}

export interface IPlannedWeekShift {
  shiftId: string
  isOverride: boolean
  shift: Pick<
    IWorkingShift,
    | "id"
    | "name"
    | "startTime"
    | "endTime"
    | "breakStartTime"
    | "breakEndTime"
    | "gracePeriodMinutes"
    | "gpsLat"
    | "gpsLng"
    | "gpsRadiusMeters"
  >
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

export interface IAssignSchedulePayload {
  employeeId: string
  days: { dayOfWeek: number; weekIndex?: number; shiftId: string }[]
  validFrom: string
  validTo?: string
  templateId?: string
  cycleWeeks?: number
}

export interface IOverrideShiftPayload {
  employeeId: string
  shiftId: string
  assignedDate: string
}

// ─── ATTENDANCE RECORD ────────────────────────────────────────

export interface IRealShift {
  id: string
  employeeId: string
  attendanceRecordId: string
  date: string
  actualStartTime: number
  actualEndTime?: number | null
  isMatched: boolean
}

export interface IAttendanceRecord {
  id: string
  employeeId: string
  employeeShiftId: string
  date: string
  checkInAt?: string
  checkInLat?: number
  checkInLng?: number
  checkOutAt?: string
  checkOutLat?: number
  checkOutLng?: number
  status: IAttendanceStatus
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
  totalWorkMinutes: number
  realShift?: IRealShift | null
  employee?: {
    id: string
    fullName: string
    email: string
  }
}

export interface IAttendanceQuery {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: IAttendanceStatus
  personalOnly?: boolean
}

/** One scheduled attendance occurrence rendered inside a matrix day cell. */
export interface IAttendanceMatrixShift {
  id: string
  shiftName?: string
  scheduledStart?: number
  checkInAt?: string
  checkOutAt?: string
  checkInVarianceMinutes?: number
  status: ICheckInVarianceStatus
}

/** Attendance occurrences grouped under one ISO calendar date. */
export interface IAttendanceMatrixDay {
  date: string
  shifts: IAttendanceMatrixShift[]
}

/** Employee row displayed in the workforce matrix. */
export interface IAttendanceMatrixEmployee {
  employeeId: string
  employeeCode: string
  fullName: string
  email?: string
  position?: string
  days: IAttendanceMatrixDay[]
}

/** Workforce matrix API response for the selected period. */
export interface IAttendanceMatrixResult {
  view: IAttendanceMatrixView
  rangeStart: string
  rangeEnd: string
  employees: IAttendanceMatrixEmployee[]
}

/** Query contract shared by week and month matrix requests. */
export interface IAttendanceMatrixQuery {
  view: IAttendanceMatrixView
  anchor: string
  search?: string
}

// ─── SHIFT CHANGE REQUEST ─────────────────────────────────────

export interface IShiftChangeRequest {
  id: string
  type: IApplicationType
  status: IApplicationStatus
  reason: string
  startDate: string
  endDate?: string
  shiftSwapDetail?: {
    employeeShiftId: string
    swapWithEmployeeId: string
    swapWithShiftId: string
  }
  createdAt: string
  updatedAt: string
}

export interface ISubmitShiftChangeRequestPayload {
  reason: string
  startDate: string
  endDate?: string
  employeeShiftId: string
  swapWithEmployeeId: string
  swapWithShiftId: string
  workingShiftId?: string
}

// ─── APPROVAL ─────────────────────────────────────────────────

export interface IApproval {
  id: string
  type: IApplicationType
  status: IApplicationStatus
  reason: string
  startDate: string
  endDate?: string
  employee?: {
    id: string
    fullName: string
    email: string
  }
  shiftSwapDetail?: {
    employeeShiftId: string
    swapWithEmployeeId: string
    swapWithShiftId: string
  }
  createdAt: string
  updatedAt: string
}

export interface IProcessApprovalPayload {
  status: "approved" | "rejected"
  rejectReason?: string
}

// ─── LEGACY (kept for VirtualScanner compat) ─────────────────

/** @deprecated use IWorkingShift */
export interface IShiftSchedule {
  _id: string
  employeeId: string
  weekdays: {
    mon?: string
    tue?: string
    wed?: string
    thu?: string
    fri?: string
    sat?: string
    sun?: string
  }
  validFrom: string
  validTo?: string
}

/** @deprecated use IAttendanceRecord */
export interface IApplication {
  _id: string
  employeeId: string
  type: IApplicationType
  status: IApplicationStatus
  reason: string
  startDate: string
  endDate: string
}

export interface IHoliday {
  id: string
  name: string
  date: string
  type: IHolidayType
  scope?: IHolidayScope
  positionId?: string | null
  position?: { id: string; name: string; code: string } | null
  batchId?: string | null
  assignees?: Array<{
    employeeId: string
    employee?: { id: string; fullName: string; email: string }
  }>
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface IHolidayQuery {
  startDate?: string
  endDate?: string
  year?: number
}

export interface IHolidayPayload {
  name: string
  /** Legacy single-day field — prefer startDate/endDate. */
  date?: string
  startDate: string
  endDate: string
  type: IHolidayType
  scope: IHolidayScope
  positionId?: string
  employeeIds?: string[]
}

// ─── WEEKLY SCHEDULE TEMPLATE ─────────────────────────────────

export interface IWeeklyScheduleTemplateDay {
  dayOfWeek: number
  shiftId?: string | null
  shift?: Pick<IWorkingShift, "id" | "name" | "startTime" | "endTime">
}

export interface IWeeklyScheduleTemplateWeek {
  weekIndex: number
  days: IWeeklyScheduleTemplateDay[]
}

export interface IWeeklyScheduleTemplate {
  id: string
  name: string
  description?: string | null
  cycleWeeks: number
  isActive: boolean
  weeks: IWeeklyScheduleTemplateWeek[]
  createdAt: string
  updatedAt: string
}

export interface ICreateWeeklyScheduleTemplatePayload {
  name: string
  description?: string | null
  cycleWeeks: number
  isActive?: boolean
  weeks: IWeeklyScheduleTemplateWeek[]
}

export interface IUpdateWeeklyScheduleTemplatePayload {
  name?: string
  description?: string | null
  cycleWeeks?: number
  isActive?: boolean
  weeks?: IWeeklyScheduleTemplateWeek[]
}

export interface IApplyWeeklyScheduleTemplatePayload {
  employeeIds: string[]
  validFrom?: string
  validTo?: string | null
  generateShifts?: boolean
}

export interface IWeeklyScheduleSettings {
  id: string
  triggerDayOfWeek: number
  triggerHour: number
  triggerMinute: number
  lastGeneratedWeekKey?: string | null
}

export interface IGenerateShiftsPayload {
  employeeIds: string[]
  startDate: string
  endDate: string
}

export interface IGenerateShiftsResult {
  created: number
  updated: number
  skipped: number
}

/** Weekly Schedule Copilot Mode A — attendance patterns for FT template schedules. */
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
