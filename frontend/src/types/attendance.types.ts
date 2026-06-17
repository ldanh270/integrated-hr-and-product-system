import type {
  IApplicationStatus,
  IApplicationType,
  IAttendanceStatus,
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
  gracePeriodMinutes?: number
  gps?: IGpsConfig
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
    "name" | "startTime" | "endTime" | "gracePeriodMinutes" | "gpsLat" | "gpsLng" | "gpsRadiusMeters"
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
  date: string
  type: IHolidayType
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
