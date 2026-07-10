import type {
  IEmployeeStatus,
  IEmployeeType,
  IWorkScheduleType,
} from "@/config/entities/employee.config"

export type EmployeeStatus = IEmployeeStatus
export type EmployeeType = IEmployeeType
export type WorkScheduleType = IWorkScheduleType // mirrored from employee.workScheduleType
export type EmployeeRole = string

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
  positionId: string | null
  roles: EmployeeRole[]
  employeeType: EmployeeType
  workScheduleType: WorkScheduleType // exposed on profile for PT vs full-time UX
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
