import {
  IApplicationStatus,
  IApplicationType,
  IAttendanceStatus,
  IRegimeType,
} from "@/configs/entities/attendance.config.ts"

export interface IGpsScanDTO {
  lat: number
  lng: number
}

// ─── ATTENDANCE RECORD ────────────────────────────────────────
export interface ICheckInDTO {
  employeeId: string
  location: IGpsScanDTO
}

export interface ICheckOutDTO {
  employeeId: string
  location: IGpsScanDTO
}

export interface IAttendanceRecordQueryDTO {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: IAttendanceStatus
}

// ─── APPLICATIONS ─────────────────────────────────────────────
export interface ISubmitApplicationDTO {
  employeeId: string
  type: IApplicationType
  reason: string
  startDate: string | Date
  endDate?: string | Date
  regimeType?: IRegimeType
  swapWith?: string // References EmployeeShift ID
}

export interface IApproveApplicationDTO {
  status: IApplicationStatus
}

// ─── REPOSITORY INTERFACES ────────────────────────────────────
export interface IAttendanceMetricsDTO {
  status?: IAttendanceStatus
  lateMinutes?: number
  earlyLeaveMinutes?: number
  overtimeMinutes?: number
  totalWorkMinutes?: number
}

export interface IAttendanceRepository {
  checkIn(employeeId: string, location: IGpsScanDTO, employeeShiftId: string): Promise<any>
  checkOut(employeeId: string, location: IGpsScanDTO, metrics?: IAttendanceMetricsDTO): Promise<any>
  findByEmployeeAndDate(employeeId: string, date: string | Date): Promise<any | null>
  queryRecords(query: IAttendanceRecordQueryDTO): Promise<any[]>
}

export interface IApplicationRepository {
  submit(data: ISubmitApplicationDTO): Promise<any>
  approve(id: string, status: IApplicationStatus, approvedBy: string): Promise<any | null>
  findByEmployee(employeeId: string): Promise<any[]>
}

export interface IHolidayRepository {
  createHoliday(name: string, date: string | Date, type: string): Promise<any>
  checkIsHoliday(date: string | Date): Promise<boolean>
}

// ─── SERVICE INTERFACES ───────────────────────────────────────
export interface IAttendanceService {
  checkIn(employeeId: string, location: IGpsScanDTO, createdById: string): Promise<any>
  checkOut(employeeId: string, location: IGpsScanDTO): Promise<any>
  getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<any[]>
}

export interface IApplicationService {
  submitApplication(data: ISubmitApplicationDTO): Promise<any>
  processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<any | null>
  getEmployeeApplications(employeeId: string): Promise<any[]>
}

export interface IHolidayService {
  createHoliday(name: string, date: string | Date, type: string): Promise<any>
  isHoliday(date: string | Date): Promise<boolean>
}
