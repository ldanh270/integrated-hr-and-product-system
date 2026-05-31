import { Types } from "mongoose"
import { IAttendanceStatus, IApplicationType, IApplicationStatus, IRegimeType } from "@/configs/constants/entities.config.ts"

export interface IGpsScanDTO {
  lat: number
  lng: number
}

// ─── ATTENDANCE RECORD ────────────────────────────────────────
export interface ICheckInDTO {
  employeeId: string | Types.ObjectId
  location: IGpsScanDTO
}

export interface ICheckOutDTO {
  employeeId: string | Types.ObjectId
  location: IGpsScanDTO
}

export interface IAttendanceRecordQueryDTO {
  startDate?: string
  endDate?: string
  employeeId?: string | Types.ObjectId
  status?: IAttendanceStatus
}

// ─── APPLICATIONS ─────────────────────────────────────────────
export interface ISubmitApplicationDTO {
  employeeId: string | Types.ObjectId
  type: IApplicationType
  reason: string
  startDate: string | Date
  endDate?: string | Date
  regimeType?: IRegimeType
  swapWith?: string | Types.ObjectId // References EmployeeShift ID
}

export interface IApproveApplicationDTO {
  status: IApplicationStatus
}

// ─── REPOSITORY INTERFACES ────────────────────────────────────
export interface IAttendanceRepository {
  checkIn(employeeId: string, location: IGpsScanDTO, shiftId?: string): Promise<any>
  checkOut(employeeId: string, location: IGpsScanDTO): Promise<any>
  queryRecords(query: IAttendanceRecordQueryDTO): Promise<any[]>
}

export interface IApplicationRepository {
  submit(data: ISubmitApplicationDTO): Promise<any>
  approve(id: string, status: IApplicationStatus, approvedBy: string): Promise<any | null>
  findByEmployee(employeeId: string): Promise<any[]>
}

export interface IHolidayRepository {
  create(name: string, date: string | Date, type: string): Promise<any>
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
  processApplication(id: string, status: IApplicationStatus, processorId: string): Promise<any | null>
  getEmployeeApplications(employeeId: string): Promise<any[]>
}

export interface IHolidayService {
  createHoliday(name: string, date: string | Date, type: string): Promise<any>
  isHoliday(date: string | Date): Promise<boolean>
}

