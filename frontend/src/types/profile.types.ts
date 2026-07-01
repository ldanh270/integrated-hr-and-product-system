import type {
  IEmployeeRole,
  IEmployeeStatus,
  IEmployeeType,
} from "@/config/entities/employee.config"

export type EmployeeStatus = IEmployeeStatus
export type EmployeeType = IEmployeeType
export type EmployeeRole = IEmployeeRole

export interface ProfileDto {
  id: string
  fullName: string
  username: string
  email: string
  phone: string | null
  dateOfBirth: string | null
  nationalId: string | null
  address: string | null
  position: string | null
  roles: EmployeeRole[]
  employeeType: EmployeeType
  status: EmployeeStatus
  startDate: string | null
  avatar: {
    url: string | null
    id: string | null
  }
  createdAt: string
  updatedAt: string
  personalEmployeeId?: string | null
  personalEmployee?: {
    id: string
    fullName: string
    email: string
  } | null
}

export interface UpdateProfileDto {
  fullName?: string
  phone?: string
  dateOfBirth?: string
  nationalId?: string
  address?: string
}

export interface ApiResponse<T> {
  status: "success" | "error"
  message?: string
  data?: T
  errors?: unknown
}
