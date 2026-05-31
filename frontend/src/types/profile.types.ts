export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated"
export type EmployeeType = "full_time" | "part_time" | "contractor" | "intern"
export type EmployeeRole = "admin" | "manager" | "employee"

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
  role: EmployeeRole
  employeeType: EmployeeType
  status: EmployeeStatus
  startDate: string | null
  avatar: {
    url: string | null
    id: string | null
  }
  createdAt: string
  updatedAt: string
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
  errors?: any
}
