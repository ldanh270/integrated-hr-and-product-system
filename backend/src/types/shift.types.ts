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

/**
 * Repository for managing shift change requests.
 */
export interface IShiftChangeRequestRepository {
  /** Submits a new shift change request. */
  submit(data: ISubmitShiftChangeRequestDTO): Promise<any>
  /** Finds requests by employee ID. */
  findByEmployee(employeeId: string): Promise<any[]>
  /** Finds a request by ID. */
  findById(id: string): Promise<any | null>
  /** Lists all pending requests. */
  listPending(): Promise<any[]>
}

/**
 * Service for managing shift change requests.
 */
export interface IShiftChangeRequestService {
  /** Submits a request. */
  submitRequest(data: ISubmitShiftChangeRequestDTO): Promise<any>
  /** Gets requests for the current employee. */
  getMyRequests(employeeId: string): Promise<any[]>
}

// ─── EMPLOYEE SHIFT (Daily Record Override) ───────────────────
export interface IOverrideEmployeeShiftDTO {
  employeeId: string
  shiftId: string
  assignedDate: string | Date
}

// ─── REPOSITORY INTERFACES ────────────────────────────────────
/**
 * Repository for working shift definitions.
 */
export interface IWorkingShiftRepository {
  /** Creates a shift. */
  create(data: ICreateWorkingShiftDTO): Promise<any>
  /** Updates a shift. */
  update(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null>
  /** Finds shift by ID. */
  findById(id: string): Promise<any | null>
  /** Lists all shifts. */
  listAll(): Promise<any[]>
  /** Deletes a shift. */
  delete(id: string): Promise<void>
}

/**
 * Repository for shift schedules (weekly patterns).
 */
export interface IShiftScheduleRepository {
  /** Assigns a pattern to an employee. */
  assignSchedule(data: IAssignShiftScheduleDTO): Promise<any>
  /** Gets the active pattern for a date. */
  getScheduleByEmployee(employeeId: string, date: string | Date): Promise<any | null>
  /** Lists patterns for an employee. */
  listSchedulesByEmployee(employeeId: string): Promise<any[]>
}

/**
 * Repository for daily employee shift records.
 */
export interface IEmployeeShiftRepository {
  /** Overrides a shift for a specific date. */
  overrideShift(data: IOverrideEmployeeShiftDTO): Promise<any>
  /** Gets shift for employee on date. */
  getShiftForEmployeeDate(employeeId: string, date: string | Date): Promise<any | null>
  /** Ensures a record exists for employee on date. */
  ensureShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
    shiftId: string,
    createdById: string,
  ): Promise<any>
}

// ─── SERVICE INTERFACES ───────────────────────────────────────
/**
 * Service for working shifts.
 */
export interface IShiftService {
  /** Creates a shift. */
  createShift(data: ICreateWorkingShiftDTO): Promise<any>
  /** Updates a shift. */
  updateShift(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null>
  /** Deletes a shift. */
  deleteShift(id: string): Promise<void>
  /** Gets shift by ID. */
  getShift(id: string): Promise<any | null>
  /** Lists all shifts. */
  listShifts(): Promise<any[]>
}

/**
 * Service for shift scheduling.
 */
export interface IScheduleService {
  /** Assigns a schedule pattern. */
  assignSchedule(data: IAssignShiftScheduleDTO): Promise<any>
  /** Gets schedule for a specific date. */
  getScheduleForEmployee(employeeId: string, date: string | Date): Promise<any | null>
  /** Lists schedules for an employee. */
  listSchedulesForEmployee(employeeId: string): Promise<any[]>
  /** Overrides shift for a date. */
  overrideEmployeeShift(data: IOverrideEmployeeShiftDTO): Promise<any>
}
