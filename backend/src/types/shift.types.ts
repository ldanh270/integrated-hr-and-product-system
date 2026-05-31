import { Types } from "mongoose"

export interface IGpsLocationDTO {
  lat: number
  lng: number
  radiusMeters?: number
}

// ─── WORKING SHIFT (Template) ──────────────────────────────────
export interface ICreateWorkingShiftDTO {
  name: string
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
  gracePeriodMinutes?: number
  gps?: IGpsLocationDTO
  isActive?: boolean
}

export interface IUpdateWorkingShiftDTO extends Partial<ICreateWorkingShiftDTO> {}

// ─── SHIFT SCHEDULE (Weekly Pattern) ──────────────────────────
export interface IAssignShiftScheduleDTO {
  employeeId: string | Types.ObjectId
  weekdays: {
    mon?: string | Types.ObjectId | null
    tue?: string | Types.ObjectId | null
    wed?: string | Types.ObjectId | null
    thu?: string | Types.ObjectId | null
    fri?: string | Types.ObjectId | null
    sat?: string | Types.ObjectId | null
    sun?: string | Types.ObjectId | null
  }
  validFrom: string | Date
  validTo?: string | Date | null
}

// ─── EMPLOYEE SHIFT (Daily Record Override) ───────────────────
export interface IOverrideEmployeeShiftDTO {
  employeeId: string | Types.ObjectId
  shiftId: string | Types.ObjectId
  assignedDate: string | Date
}

// ─── REPOSITORY INTERFACES ────────────────────────────────────
export interface IWorkingShiftRepository {
  create(data: ICreateWorkingShiftDTO): Promise<any>
  update(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null>
  findById(id: string): Promise<any | null>
  listAll(): Promise<any[]>
}

export interface IShiftScheduleRepository {
  assignSchedule(data: IAssignShiftScheduleDTO): Promise<any>
  getScheduleByEmployee(employeeId: string, date: string | Date): Promise<any | null>
}

export interface IEmployeeShiftRepository {
  overrideShift(data: IOverrideEmployeeShiftDTO): Promise<any>
  getShiftForEmployeeDate(employeeId: string, date: string | Date): Promise<any | null>
}

// ─── SERVICE INTERFACES ───────────────────────────────────────
export interface IShiftService {
  createShift(data: ICreateWorkingShiftDTO): Promise<any>
  updateShift(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null>
  getShift(id: string): Promise<any | null>
  listShifts(): Promise<any[]>
}

export interface IScheduleService {
  assignSchedule(data: IAssignShiftScheduleDTO): Promise<any>
  getScheduleForEmployee(employeeId: string, date: string | Date): Promise<any | null>
  overrideEmployeeShift(data: IOverrideEmployeeShiftDTO): Promise<any>
}


