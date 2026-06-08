import {
  IApplicationStatus,
  IApplicationType,
  IAttendanceStatus,
  ILeaveType,
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

export interface ILeaveApplicationDetailDTO {
  leaveType: ILeaveType
  documentUrl?: string
}

export interface IShiftSwapApplicationDetailDTO {
  employeeShiftId: string // The shift ID of the requester
  workingShiftId?: string // Optional: target working shift ID
  swapWithEmployeeId: string // The partner employee ID
  swapWithShiftId: string // The shift ID of the partner
}

export interface IOvertimeApplicationDetailDTO {
  employeeShiftId: string
  expectedMinutes?: number
}

export interface IRegimeApplicationDetailDTO {
  regimeType: IRegimeType
  reducedMinutesPerDay: number
  applyToStart: boolean
  applyToEnd: boolean
  documentUrl?: string
}

export interface ILateEarlyApplicationDetailDTO {
  employeeShiftId: string
  durationMinutes: number
  isLate: boolean
}

export interface ISubmitApplicationDTO {
  employeeId: string
  type: IApplicationType
  startDate: string | Date
  endDate: string | Date
  reason?: string
  note?: string
  workingShiftId?: string // Optional for some types like Leave or OT

  // Details based on type
  leaveDetail?: ILeaveApplicationDetailDTO
  shiftSwapDetail?: IShiftSwapApplicationDetailDTO
  overtimeDetail?: IOvertimeApplicationDetailDTO
  regimeDetail?: IRegimeApplicationDetailDTO
  lateEarlyDetail?: ILateEarlyApplicationDetailDTO
}

export interface IApproveApplicationDTO {
  status: IApplicationStatus
  rejectReason?: string
}

// ─── REPOSITORY INTERFACES ────────────────────────────────────
export interface IAttendanceRepository {
  checkIn(employeeId: string, location: IGpsScanDTO, employeeShiftId?: string): Promise<any>
  checkOut(employeeId: string, location: IGpsScanDTO): Promise<any>
  queryRecords(query: IAttendanceRecordQueryDTO): Promise<any[]>
}

export interface IApplicationRepository {
  submit(data: ISubmitApplicationDTO): Promise<any>
  approve(
    id: string,
    status: IApplicationStatus,
    approvedBy: string,
    rejectReason?: string,
  ): Promise<any | null>
  findByEmployee(employeeId: string): Promise<any[]>
  findById(id: string): Promise<any | null>
}

export interface IHolidayRepository {
  createHoliday(name: string, date: string | Date, type: string): Promise<any>
  checkIsHoliday(date: string | Date): Promise<boolean>
}

// ─── SERVICE INTERFACES ───────────────────────────────────────
export interface IAttendanceService {
  checkIn(employeeId: string, location: IGpsScanDTO): Promise<any>
  checkOut(employeeId: string, location: IGpsScanDTO): Promise<any>
  getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<any[]>
}

export interface IApplicationService {
  submitApplication(data: ISubmitApplicationDTO): Promise<any>
  processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
    rejectReason?: string,
  ): Promise<any | null>
  getEmployeeApplications(employeeId: string): Promise<any[]>
  getApplicationDetail(id: string): Promise<any>
}

export interface IHolidayService {
  createHoliday(name: string, date: string | Date, type: string): Promise<any>
  isHoliday(date: string | Date): Promise<boolean>
}
