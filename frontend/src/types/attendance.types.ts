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
  employeeId: string | any
  shiftId: string | any
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
  employeeId: string | any
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

export interface IApplication {
  _id: string
  employeeId: string | any
  type: IApplicationType
  status: IApplicationStatus
  reason: string
  startDate: string
  endDate: string
  regimeType?: IRegimeType
}

export interface IHoliday {
  _id: string
  name: string
  date: string
  type: string
}
