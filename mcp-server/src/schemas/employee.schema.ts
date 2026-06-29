import { IEmployeeStatus } from "../constants/entities/employee.config.js"

export interface ListEmployeesInput {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  status?: IEmployeeStatus
}

export interface CreateEmployeeInput {
  email: string
  firstName: string
  lastName: string
  role: string
  joinDate?: string
}

export interface UpdateEmployeeInput {
  firstName?: string
  lastName?: string
  role?: string
}

export interface UpdateEmployeeStatusInput {
  status: IEmployeeStatus
  reason?: string
}
