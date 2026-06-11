import {
  IApplicationStatus,
  IApplicationType,
  IAttendanceStatus,
  ILeaveType,
  IRegimeType,
} from "@/configs/entities/attendance.config.ts"

// Re-export for consumers that import from this module
export type { IApplicationStatus, IApplicationType, IAttendanceStatus, ILeaveType, IRegimeType }

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
  employeeShiftId: string          // EmployeeShift to swap away
  workingShiftId?: string          // Target WorkingShift type (optional)
  swapWithEmployeeId?: string      // Specific employee to swap with (optional)
  swapWithShiftId?: string         // Specific EmployeeShift of that employee (optional)
}

export interface IBusinessTripDetailDTO {
  location: string
  purpose?: string
  budget?: number
}

export interface ILateEarlyDetailDTO {
  employeeShiftId: string
  durationMinutes: number
  isLate: boolean                  // true = late arrival, false = early leave
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

// ─── REPOSITORY INTERFACES ────────────────────────────────────

export interface IAttendanceRepository {
  checkIn(employeeId: string, location: IGpsScanDTO, employeeShiftId?: string): Promise<any>
  checkOut(employeeId: string, location: IGpsScanDTO): Promise<any>
  queryRecords(query: IAttendanceRecordQueryDTO): Promise<any[]>
}

export interface IApplicationRepository {
  submit(data: ISubmitApplicationDTO): Promise<any>
  findById(id: string): Promise<any | null>
  findByEmployee(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: any[]; total: number }>
  findAll(query: IListApplicationsQueryDTO): Promise<{ data: any[]; total: number }>
  cancel(id: string, employeeId: string): Promise<any | null>
  approve(id: string, status: IApplicationStatus, approvedBy: string): Promise<any | null>
  checkLeaveOverlap(
    employeeId: string,
    startDate: string | Date,
    endDate: string | Date,
    excludeId?: string,
  ): Promise<boolean>
  getUsedLeaveDays(
    employeeId: string,
    leaveType: ILeaveType,
    year: number,
  ): Promise<number>
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
  cancelApplication(id: string, requesterId: string): Promise<any>
  getApplicationById(id: string): Promise<any>
  listApplications(query: IListApplicationsQueryDTO): Promise<{ data: any[]; total: number }>
  getEmployeeApplications(
    employeeId: string,
    query: IListApplicationsQueryDTO,
    requester?: { empId: string; role: string },
  ): Promise<{ data: any[]; total: number }>
  processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<any | null>
}

export interface IHolidayService {
  createHoliday(name: string, date: string | Date, type: string): Promise<any>
  isHoliday(date: string | Date): Promise<boolean>
}
