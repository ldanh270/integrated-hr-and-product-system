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
  createdById: string
}

export interface IUpdateWorkingShiftDTO extends Partial<ICreateWorkingShiftDTO> {}

// ─── SHIFT SCHEDULE (Weekly Pattern) ──────────────────────────
export interface IAssignShiftScheduleDTO {
  employeeId: string
  workingShiftId: string
  validFrom: string | Date
  validTo?: string | Date | null
  createdById: string
  days?: {
    dayOfWeek: number
    shiftId: string
  }[]
}

// ─── EMPLOYEE SHIFT (Daily Record Override) ───────────────────
export interface IOverrideEmployeeShiftDTO {
  employeeId: string
  shiftId: string
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
