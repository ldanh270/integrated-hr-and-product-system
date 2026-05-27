export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated"
export type EmployeeType = "full_time" | "part_time" | "contractor" | "intern"
export type EmployeeRole = "admin" | "manager" | "employee"

export interface Employee {
  id: string
  fullName: string
  email: string
  role: EmployeeRole
  phone: string | null
  position: string | null
  employeeType: EmployeeType
  status: EmployeeStatus
  createdAt: Date
  updatedAt: Date
}

export interface EmployeeDb {
  _id: { toString(): string }
  fullName: string
  email: string
  role: EmployeeRole
  phone?: string
  position?: string
  employeeType: EmployeeType
  status: EmployeeStatus
  createdAt: Date
  updatedAt: Date
}

export interface IEmployeeRepository {
  listEmployees(): Promise<Employee[]>
}

export interface IEmployeeService {
  listEmployees(): Promise<Employee[]>
}
