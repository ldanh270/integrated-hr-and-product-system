import type {
  IEmployeeStatus,
  IEmployeeType,
} from "@/config/entities/employee.config"

export type EmployeeStatus = IEmployeeStatus
export type EmployeeType = IEmployeeType
export type EmployeeRole = string

export interface Employee {
  id: string
  fullName: string
  username: string
  email: string
  role?: EmployeeRole | string | null
  roles?: string[]
  phone: string | null
  position: string | null
  employeeType: EmployeeType
  status: EmployeeStatus
  dateOfBirth: string | null // ISO string
  nationalId: string | null
  address: string | null
  startDate: string | null
  endDate: string | null
  avatar: { url: string | null; id: string | null } | null
  version?: number
  createdAt: string
  updatedAt: string
}

export interface PaginatedEmployees {
  data: Employee[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface EmployeeListQuery {
  page?: number
  limit?: number
  search?: string
  status?: EmployeeStatus
  role?: EmployeeRole
  roleId?: string
  type?: EmployeeType
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface CreateEmployeeDto {
  fullName: string
  email: string
  username: string
  password?: string
  role?: EmployeeRole
  phone?: string
  position?: string
  employeeType?: EmployeeType
  status?: EmployeeStatus
  dateOfBirth?: string
  nationalId?: string
  address?: string
  startDate?: string
}

export interface UpdateEmployeeDto {
  fullName?: string
  email?: string
  username?: string
  password?: string
  phone?: string | null
  position?: string | null
  employeeType?: EmployeeType
  status?: EmployeeStatus
  dateOfBirth?: string | null
  nationalId?: string | null
  address?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface UpdateStatusDto {
  status: EmployeeStatus
}
