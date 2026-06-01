import type {
  CreateEmployeeDto,
  Employee,
  EmployeeListQuery,
  PaginatedEmployees,
  UpdateEmployeeDto,
  UpdateStatusDto,
} from "../../types/employee.types"

export declare const employeeApi: {
  list: (query?: EmployeeListQuery) => Promise<PaginatedEmployees>
  getOne: (id: string) => Promise<Employee>
  create: (data: CreateEmployeeDto) => Promise<Employee>
  update: (id: string, data: UpdateEmployeeDto) => Promise<Employee>
  updateStatus: (id: string, data: UpdateStatusDto) => Promise<Employee>
}
