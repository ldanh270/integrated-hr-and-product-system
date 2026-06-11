import { IEmployeeStatus, IEmployeeType, ROLE } from "@/configs/entities/employee.config.ts"
import { SORT_ORDER } from "@/configs/system/db.config.ts"

/**
 * Type representing valid Employee Status values.
 */
export type EmployeeStatus = IEmployeeStatus

/**
 * Type representing valid Employee Type values.
 */
export type EmployeeType = IEmployeeType

/**
 * Type representing valid Employee Role values.
 */
export type EmployeeRole = (typeof ROLE)[keyof typeof ROLE]

/**
 * Domain interface representing an Employee object.
 */
export interface Employee {
  /** Unique ID of the employee */
  id: string
  /** Full name of the employee */
  fullName: string
  /** Login username of the employee */
  username: string
  /** Email address of the employee */
  email: string
  /** Application role (e.g. employee, admin) */
  role: EmployeeRole
  /** Contact phone number (nullable) */
  phone: string | null
  /** Job position / title (nullable) */
  position: string | null
  /** Type of employment (e.g. full-time, part-time) */
  employeeType: EmployeeType
  /** Active status of the employee */
  status: EmployeeStatus
  /** Date of birth (nullable) */
  dateOfBirth: Date | null
  /** National Identification Number (nullable) */
  nationalId: string | null
  /** Resident address (nullable) */
  address: string | null
  /** Employment start date (nullable) */
  startDate: Date | null
  /** Employment termination date (nullable) */
  endDate: Date | null
  /** Avatar object containing URL and ID (nullable) */
  avatar: { url: string | null; id: string | null } | null
  /** Record creation timestamp */
  createdAt: Date
  /** Record last modification timestamp */
  updatedAt: Date
}

/**
 * DTO for creating a new Employee.
 */
export interface CreateEmployeeDto {
  fullName: string
  email: string
  username: string
  passwordHash?: string
  role?: EmployeeRole
  phone?: string | null
  position?: string | null
  employeeType?: EmployeeType
  status?: EmployeeStatus
  dateOfBirth?: Date | string | null
  nationalId?: string | null
  address?: string | null
  startDate?: Date | string | null
}

/**
 * DTO for updating an existing Employee.
 */
export interface UpdateEmployeeDto {
  fullName?: string
  phone?: string | null
  position?: string | null
  employeeType?: EmployeeType
  status?: EmployeeStatus
  dateOfBirth?: Date | string | null
  nationalId?: string | null
  address?: string | null
  startDate?: Date | string | null
  endDate?: Date | string | null
}

/**
 * Query criteria interface for retrieving filtered, paginated employees list.
 */
export interface EmployeeListQuery {
  /** Page number for pagination (starts at 1) */
  page?: number
  /** Limit of items per page */
  limit?: number
  /** Partial search string for names/emails */
  search?: string
  /** Status filter */
  status?: EmployeeStatus
  /** Role filter */
  role?: EmployeeRole
  /** Employee type filter */
  employeeType?: EmployeeType
  /** Column/property to sort by */
  sortBy?: string
  /** Sort order direction */
  sortOrder?: (typeof SORT_ORDER)[keyof typeof SORT_ORDER]
}

/**
 * DTO for a paginated list of employees.
 */
export interface PaginatedEmployeesDto {
  data: Employee[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Contract boundary for Employee database access operations.
 */
export interface IEmployeeRepository {
  /** Get paginated list of employees */
  listEmployeesPaginated(query: EmployeeListQuery): Promise<PaginatedEmployeesDto>
  /** Find single employee by ID */
  findById(id: string): Promise<Employee | null>
  /** Create employee */
  createEmployee(data: CreateEmployeeDto & { passwordHash: string }): Promise<Employee>
  /** Update employee details */
  updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null>
  /** Update status of employee */
  updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null>
  /** Soft delete employee */
  deleteEmployee(id: string): Promise<boolean>
}

/**
 * Contract boundary for Employee business logic operations.
 */
export interface IEmployeeService {
  /** Retrieve list of employees */
  listEmployees(query: EmployeeListQuery): Promise<PaginatedEmployeesDto>
  /** Retrieve single employee details */
  getEmployee(id: string): Promise<Employee | null>
  /** Register a new employee */
  createEmployee(data: CreateEmployeeDto & { password?: string }): Promise<Employee>
  /** Update existing employee info */
  updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null>
  /** Update employee status */
  updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null>
  /** Remove employee record (soft delete) */
  deleteEmployee(id: string): Promise<boolean>
}
