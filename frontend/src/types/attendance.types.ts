import type {
  IApplicationStatus,
  IApplicationType,
  IAttendanceStatus,
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

export interface IUpdateShiftPayload extends Partial<ICreateShiftPayload> {}

// ─── SCHEDULE ─────────────────────────────────────────────────

export interface IScheduleDay {
  dayOfWeek: number // 0=Sun, 1=Mon, … 6=Sat
  shiftId: string
  shift?: Pick<IWorkingShift, "name" | "startTime" | "endTime">
}

export interface ISchedule {
  id: string
  employeeId: string
  validFrom: string
  validTo?: string | null
  days: IScheduleDay[]
}

export interface IAssignSchedulePayload {
  employeeId: string
  days: { dayOfWeek: number; shiftId: string }[]
  validFrom: string
  validTo?: string
}

export interface IOverrideShiftPayload {
  employeeId: string
  shiftId: string
  assignedDate: string
}

// ─── ATTENDANCE RECORD ────────────────────────────────────────

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
  _id: string
  name: string
  date: string
  type: string
}
