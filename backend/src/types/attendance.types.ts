import {
  IApplicationStatus,
  IApplicationType,
  IAttendanceStatus,
  IHolidayType,
  ILeaveType,
  IRegimeType,
} from "@/configs/entities/attendance.config.ts"

import type { HolidayCalendar } from "@prisma/client"

// Re-export for consumers that import from this module
export type {
  IApplicationStatus,
  IApplicationType,
  IAttendanceStatus,
  IHolidayType,
  ILeaveType,
  IRegimeType,
}

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

// ─── APPLICATION DETAIL DTOs ──────────────────────────────────

export interface ILeaveDetailDTO {
  leaveType: ILeaveType
  regimeType: IRegimeType
}

export interface IOvertimeDetailDTO {
  employeeShiftId: string
}

export interface IWorkFromHomeDetailDTO {
  location?: string
}

export interface IShiftSwapDetailDTO {
  employeeShiftId: string // EmployeeShift to swap away
  workingShiftId?: string // Target WorkingShift type (optional)
  swapWithEmployeeId?: string // Specific employee to swap with (optional)
  swapWithShiftId?: string // Specific EmployeeShift of that employee (optional)
}

export interface IBusinessTripDetailDTO {
  location: string
  purpose?: string
  budget?: number
}

export interface ILateEarlyDetailDTO {
  employeeShiftId: string
  durationMinutes: number
  isLate: boolean // true = late arrival, false = early leave
}

export interface IRegimeDetailDTO {
  regimeType: IRegimeType
  reducedMinutesPerDay: number
  applyToStart?: boolean
  applyToEnd?: boolean
  documentUrl?: string
}

// ─── BASE APPLICATION FIELDS ──────────────────────────────────

interface IBaseApplicationDTO {
  employeeId: string
  startDate: string | Date
  endDate: string | Date
  reason?: string
  note?: string
  assignedToId?: string
}

// ─── DISCRIMINATED UNION SUBMIT DTO ──────────────────────────

export type ISubmitApplicationDTO =
  | (IBaseApplicationDTO & { type: "leave"; detail: ILeaveDetailDTO })
  | (IBaseApplicationDTO & { type: "overtime"; detail: IOvertimeDetailDTO })
  | (IBaseApplicationDTO & { type: "work_from_home"; detail: IWorkFromHomeDetailDTO })
  | (IBaseApplicationDTO & { type: "shift_swap"; detail: IShiftSwapDetailDTO })
  | (IBaseApplicationDTO & { type: "business_trip"; detail: IBusinessTripDetailDTO })
  | (IBaseApplicationDTO & { type: "late_early"; detail: ILateEarlyDetailDTO })
  | (IBaseApplicationDTO & { type: "regime"; detail: IRegimeDetailDTO })
  | (IBaseApplicationDTO & { type: "resignation"; detail: Record<string, unknown> })

export interface IApproveApplicationDTO {
  status: IApplicationStatus
}

// ─── QUERY DTOs ───────────────────────────────────────────────

export interface IListApplicationsQueryDTO {
  page?: number
  pageSize?: number
  type?: IApplicationType
  status?: IApplicationStatus
  employeeId?: string
  startDate?: string
  endDate?: string
}

export interface IListHolidaysQueryDTO {
  startDate?: string | Date
  endDate?: string | Date
  year?: number
}

export interface IUpdateHolidayDTO {
  name?: string
  date?: string | Date
  type?: IHolidayType
}

// ─── REPOSITORY INTERFACES ────────────────────────────────────
export interface IAttendanceMetricsDTO {
  status?: IAttendanceStatus
  lateMinutes?: number
  earlyLeaveMinutes?: number
  overtimeMinutes?: number
  totalWorkMinutes?: number
}

export interface IRealShiftDTO {
  id: string
  employeeId: string
  attendanceRecordId: string
  date: Date | string
  actualStartTime: number
  actualEndTime?: number | null
  isMatched: boolean
}

export interface IRealShiftUpsertDTO {
  actualEndTime?: number | null
  isMatched?: boolean
}

export interface IAttendanceShiftDTO {
  id?: string
  name?: string
  startTime: number
  endTime: number
  gracePeriodMinutes?: number | null
  gpsLat?: number | null
  gpsLng?: number | null
  gpsRadiusMeters?: number | null
  isActive?: boolean
}

export interface IAttendanceScheduleDayDTO {
  dayOfWeek: number
  shiftId?: string | null
  shift?: IAttendanceShiftDTO | null
}

export interface IAttendanceScheduleDTO {
  days?: IAttendanceScheduleDayDTO[]
  workingShiftId?: string | null
}

export interface IAttendanceEmployeeShiftDTO {
  id: string
  shiftId: string
  shift?: IAttendanceShiftDTO | null
}

export interface IAttendanceEmployeeDTO {
  fullName?: string | null
  email?: string | null
}

export interface IAttendanceRecordDTO {
  id: string
  employeeId: string
  employeeShiftId: string
  date: Date | string
  checkInAt?: Date | string | null
  checkInLat?: number | null
  checkInLng?: number | null
  checkOutAt?: Date | string | null
  checkOutLat?: number | null
  checkOutLng?: number | null
  status: IAttendanceStatus
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
  totalWorkMinutes: number
  employee?: IAttendanceEmployeeDTO | null
  employeeShift?: IAttendanceEmployeeShiftDTO | null
  realShift?: IRealShiftDTO | null
}

/**
 * Repository for managing attendance records.
 */
export interface IAttendanceRepository {
  /** Records a check-in. */
  checkIn(
    employeeId: string,
    location: IGpsScanDTO,
    employeeShiftId: string,
  ): Promise<IAttendanceRecordDTO>
  /** Records a check-out. */
  checkOut(
    recordId: string,
    location: IGpsScanDTO,
    metrics?: IAttendanceMetricsDTO,
    realShift?: IRealShiftUpsertDTO,
  ): Promise<IAttendanceRecordDTO>
  /** Finds record by employee and date. */
  findByEmployeeAndDate(employeeId: string, date: string | Date): Promise<IAttendanceRecordDTO | null>
  /** Queries records with filters. */
  queryRecords(query: IAttendanceRecordQueryDTO): Promise<IAttendanceRecordDTO[]>
}

/**
 * Repository for managing applications (leave, OT, etc.).
 */
export interface IApplicationRepository {
  /** Submits a new application. */
  submit(data: ISubmitApplicationDTO): Promise<any>
  findById(id: string): Promise<any | null>
  findByEmployee(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: any[]; total: number }>
  findAll(query: IListApplicationsQueryDTO): Promise<{ data: any[]; total: number }>
  cancel(id: string, employeeId: string): Promise<any | null>
  /** Approves an application (sets status=approved). */
  approve(id: string, approvedBy: string): Promise<any | null>
  /** Rejects an application with a mandatory reason. */
  reject(id: string, rejectedBy: string, rejectReason: string): Promise<any | null>
  checkLeaveOverlap(
    employeeId: string,
    startDate: string | Date,
    endDate: string | Date,
    excludeId?: string,
  ): Promise<boolean>
  getUsedLeaveDays(employeeId: string, leaveType: ILeaveType, year: number): Promise<number>
}

/**
 * Repository for managing holiday information.
 */
export interface IHolidayRepository {
  /** Lists holiday records. */
  listHolidays(query?: IListHolidaysQueryDTO): Promise<HolidayCalendar[]>
  /** Creates a holiday record. */
  createHoliday(
    name: string,
    date: string | Date,
    type: IHolidayType,
    createdById: string,
  ): Promise<HolidayCalendar>
  /** Updates a holiday record. */
  updateHoliday(id: string, data: IUpdateHolidayDTO): Promise<HolidayCalendar>
  /** Deletes a holiday record. */
  deleteHoliday(id: string): Promise<void>
  /** Checks if a specific date is a holiday. */
  checkIsHoliday(date: string | Date): Promise<boolean>
}

/**
 * Service for attendance operations.
 */
export interface IAttendanceService {
  /** Handles check-in process. */
  checkIn(
    employeeId: string,
    location: IGpsScanDTO,
    createdById: string,
  ): Promise<IAttendanceRecordDTO>
  /** Handles check-out process. */
  checkOut(employeeId: string, location: IGpsScanDTO): Promise<IAttendanceRecordDTO>
  /** Handles smart scan process. */
  scan(
    employeeId: string,
    location: IGpsScanDTO,
    createdById: string,
  ): Promise<IAttendanceRecordDTO>
  /** Queries attendance records. */
  getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<IAttendanceRecordDTO[]>
}

/**
 * Service for application processing.
 */
export interface IApplicationService {
  /** Submits an application. */
  submitApplication(data: ISubmitApplicationDTO): Promise<any>
  cancelApplication(id: string, requesterId: string): Promise<any>
  getApplicationById(id: string): Promise<any>
  listApplications(query: IListApplicationsQueryDTO): Promise<{ data: any[]; total: number }>
  getEmployeeApplications(
    employeeId: string,
    query: IListApplicationsQueryDTO,
    requester?: { empId: string; role: string },
  ): Promise<{ data: any[]; total: number }>
  /** Approves a pending application. */
  approveApplication(id: string, processorId: string): Promise<any>
  /** Rejects a pending application with a mandatory reason. */
  rejectApplication(id: string, processorId: string, rejectReason: string): Promise<any>
  /** @deprecated Use approveApplication / rejectApplication instead. */
  processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<any | null>
}

/**
 * Service for holiday management.
 */
export interface IHolidayService {
  /** Lists holidays. */
  listHolidays(query?: IListHolidaysQueryDTO): Promise<HolidayCalendar[]>
  /** Creates a holiday. */
  createHoliday(
    name: string,
    date: string | Date,
    type: IHolidayType,
    createdById: string,
  ): Promise<HolidayCalendar>
  /** Updates a holiday. */
  updateHoliday(id: string, data: IUpdateHolidayDTO): Promise<HolidayCalendar>
  /** Deletes a holiday. */
  deleteHoliday(id: string): Promise<void>
  /** Checks if a date is a holiday. */
  isHoliday(date: string | Date): Promise<boolean>
}
