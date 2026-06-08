import type {
  IApplicationStatus,
  IApplicationType,
  IRegimeType,
} from "@/config/entities/attendance.config"

export interface IGpsLocation {
  lat: number
  lng: number
}

export interface ICheckInOutRequest {
  location: IGpsLocation
}

export interface IAttendanceRecord {
  _id: string
  employeeId: string
  shiftId: string
  date: string
  checkIn: {
    at: string
    location: IGpsLocation
  }
  checkOut?: {
    at: string
    location: IGpsLocation
  }
  status: string
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
  totalWorkMinutes: number
}

export interface IWorkingShift {
  _id: string
  shiftCode: string
  shiftName: string
  startTime: string
  endTime: string
  breakStartTime?: string
  breakEndTime?: string
  gracePeriodMinutes: number
  gps?: {
    lat: number
    lng: number
    radiusMeters: number
  }
  isActive: boolean
}

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

export interface IApplicationDetails {
  // Common fields
  reason?: string
  note?: string

  // Leave specific
  leaveType?: string
  startDate?: string
  endDate?: string
  totalDays?: number

  // OT specific
  otDate?: string
  startTime?: string
  endTime?: string
  totalHours?: number

  // Shift Swap specific
  fromShiftId?: string
  toShiftId?: string
  swapDate?: string

  // WFH/Remote specific
  workMode?: string

  // Business Trip specific
  destination?: string

  // Recruitment Proposal specific (from manager side usually, but good to have)
  position?: string
  headcount?: number
  expectedStart?: string
}

export interface IApplication {
  _id: string
  employeeId: string
  employeeName?: string
  type: IApplicationType
  status: IApplicationStatus
  createdAt: string
  details: IApplicationDetails
}

export interface IHoliday {
  _id: string
  name: string
  date: string
  type: string
}
