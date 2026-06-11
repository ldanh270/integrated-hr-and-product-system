import { IEmployeeStatus, IEmployeeType, ROLE } from "@/configs/entities/employee.config.ts"

export type EmployeeStatus = IEmployeeStatus
export type EmployeeType = IEmployeeType
export type EmployeeRole = (typeof ROLE)[keyof typeof ROLE]

export interface Employee {
  id: string
  fullName: string
  username: string
  email: string
  role: EmployeeRole
  phone: string | null
  position: string | null
  employeeType: EmployeeType
  status: EmployeeStatus
  dateOfBirth: Date | null
  nationalId: string | null
  address: string | null
  startDate: Date | null
  endDate: Date | null
  avatar: { url: string | null; id: string | null } | null
  createdAt: Date
  updatedAt: Date
}

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

export interface EmployeeListQuery {
  page?: number
  limit?: number
  search?: string
  status?: EmployeeStatus
  role?: EmployeeRole
  employeeType?: EmployeeType
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedEmployeesDto {
  data: Employee[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface IEmployeeRepository {
  listEmployeesPaginated(query: EmployeeListQuery): Promise<PaginatedEmployeesDto>
  findById(id: string): Promise<Employee | null>
  createEmployee(data: CreateEmployeeDto & { passwordHash: string }): Promise<Employee>
  updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null>
  updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null>
  deleteEmployee(id: string): Promise<boolean>
}

export interface IEmployeeService {
  listEmployees(query: EmployeeListQuery): Promise<PaginatedEmployeesDto>
  getEmployee(id: string): Promise<Employee | null>
  createEmployee(data: CreateEmployeeDto & { password?: string }): Promise<Employee>
  updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null>
  updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null>
  deleteEmployee(id: string): Promise<boolean>
}
