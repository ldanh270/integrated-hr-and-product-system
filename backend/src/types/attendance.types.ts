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

/**
 * Repository for managing attendance records.
 */
export interface IAttendanceRepository {
  /** Records a check-in. */
  checkIn(employeeId: string, location: IGpsScanDTO, employeeShiftId: string): Promise<any>
  /** Records a check-out. */
  checkOut(employeeId: string, location: IGpsScanDTO, metrics?: IAttendanceMetricsDTO): Promise<any>
  /** Finds record by employee and date. */
  findByEmployeeAndDate(employeeId: string, date: string | Date): Promise<any | null>
  /** Queries records with filters. */
  queryRecords(query: IAttendanceRecordQueryDTO): Promise<any[]>
}

/**
 * Repository for managing applications (leave, OT, etc.).
 */
export interface IApplicationRepository {
  /** Submits a new application. */
  submit(data: ISubmitApplicationDTO): Promise<any>
  /** Approves or rejects an application. */
  approve(id: string, status: IApplicationStatus, approvedBy: string): Promise<any | null>
  /** Finds applications by employee. */
  findByEmployee(employeeId: string): Promise<any[]>
}

/**
 * Repository for managing holiday information.
 */
export interface IHolidayRepository {
  /** Creates a holiday record. */
  createHoliday(name: string, date: string | Date, type: string): Promise<any>
  /** Checks if a specific date is a holiday. */
  checkIsHoliday(date: string | Date): Promise<boolean>
}

// ─── SERVICE INTERFACES ───────────────────────────────────────
/**
 * Service for attendance operations.
 */
export interface IAttendanceService {
  /** Handles check-in process. */
  checkIn(employeeId: string, location: IGpsScanDTO, createdById: string): Promise<any>
  /** Handles check-out process. */
  checkOut(employeeId: string, location: IGpsScanDTO): Promise<any>
  /** Queries attendance records. */
  getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<any[]>
}

/**
 * Service for application processing.
 */
export interface IApplicationService {
  /** Submits an application. */
  submitApplication(data: ISubmitApplicationDTO): Promise<any>
  /** Processes (approves/rejects) an application. */
  processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<any | null>
  /** Gets applications for an employee. */
  getEmployeeApplications(employeeId: string): Promise<any[]>
}

/**
 * Service for holiday management.
 */
export interface IHolidayService {
  /** Creates a holiday. */
  createHoliday(name: string, date: string | Date, type: string): Promise<any>
  /** Checks if a date is a holiday. */
  isHoliday(date: string | Date): Promise<boolean>
}
