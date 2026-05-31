import apiClient from "@/lib/api-client"
import type {
  CreateEmployeeDto,
  Employee,
  EmployeeListQuery,
  PaginatedEmployees,
  UpdateEmployeeDto,
  UpdateStatusDto,
} from "@/types/employee.types"

interface ApiResponse<T> {
  data: T
  error: any
  status?: string
}

export const employeeApi = {
  list: async (query?: EmployeeListQuery): Promise<PaginatedEmployees> => {
    const response = await apiClient.get<ApiResponse<PaginatedEmployees>>("/employees", { params: query })
    return response.data.data
  },

  getOne: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`)
    return response.data.data
  },

  create: async (data: CreateEmployeeDto): Promise<Employee> => {
    const response = await apiClient.post<ApiResponse<Employee>>("/employees", data)
    return response.data.data
  },

  update: async (id: string, data: UpdateEmployeeDto): Promise<Employee> => {
    const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, data)
    return response.data.data
  },

  updateStatus: async (id: string, data: UpdateStatusDto): Promise<Employee> => {
    const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}/status`, data)
    return response.data.data
  },
}
