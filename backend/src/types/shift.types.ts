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
  validFrom: string | Date
  validTo?: string | Date | null
  createdById: string
  days?: {
    dayOfWeek: number
    shiftId: string
  }[]
}

// ─── SHIFT CHANGE REQUEST ──────────────────────────────────────
export interface ISubmitShiftChangeRequestDTO {
  employeeId: string
  reason: string
  startDate: string | Date
  endDate?: string | Date
  employeeShiftId: string    // Shift the employee wants to swap FROM
  swapWithEmployeeId: string // Target employee to swap WITH
  swapWithShiftId: string    // Target EmployeeShift to swap WITH
  workingShiftId?: string    // Target WorkingShift template (optional)
}

export interface IShiftChangeRequestRepository {
  submit(data: ISubmitShiftChangeRequestDTO): Promise<any>
  findByEmployee(employeeId: string): Promise<any[]>
  findById(id: string): Promise<any | null>
  listPending(): Promise<any[]>
}

export interface IShiftChangeRequestService {
  submitRequest(data: ISubmitShiftChangeRequestDTO): Promise<any>
  getMyRequests(employeeId: string): Promise<any[]>
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
  delete(id: string): Promise<void>
}

export interface IShiftScheduleRepository {
  assignSchedule(data: IAssignShiftScheduleDTO): Promise<any>
  getScheduleByEmployee(employeeId: string, date: string | Date): Promise<any | null>
  listSchedulesByEmployee(employeeId: string): Promise<any[]>
}

export interface IEmployeeShiftRepository {
  overrideShift(data: IOverrideEmployeeShiftDTO): Promise<any>
  getShiftForEmployeeDate(employeeId: string, date: string | Date): Promise<any | null>
  ensureShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
    shiftId: string,
    createdById: string,
  ): Promise<any>
}

// ─── SERVICE INTERFACES ───────────────────────────────────────
export interface IShiftService {
  createShift(data: ICreateWorkingShiftDTO): Promise<any>
  updateShift(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null>
  deleteShift(id: string): Promise<void>
  getShift(id: string): Promise<any | null>
  listShifts(): Promise<any[]>
}

export interface IScheduleService {
  assignSchedule(data: IAssignShiftScheduleDTO): Promise<any>
  getScheduleForEmployee(employeeId: string, date: string | Date): Promise<any | null>
  listSchedulesForEmployee(employeeId: string): Promise<any[]>
  overrideEmployeeShift(data: IOverrideEmployeeShiftDTO): Promise<any>
}
