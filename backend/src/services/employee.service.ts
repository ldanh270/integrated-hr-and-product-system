import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CreateEmployeeDto,
  Employee,
  EmployeeListQuery,
  EmployeeStatus,
  IEmployeeRepository,
  IEmployeeService,
  PaginatedEmployeesDto,
  UpdateEmployeeDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

export class EmployeeService implements IEmployeeService {
  constructor(private repository: IEmployeeRepository) {}

  async listEmployees(query: EmployeeListQuery): Promise<PaginatedEmployeesDto> {
    return this.repository.listEmployeesPaginated(query)
  }

  async getEmployee(id: string): Promise<Employee | null> {
    const employee = await this.repository.findById(id)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "EmployeeService")
    }
    return employee
  }

  async createEmployee(data: CreateEmployeeDto & { password?: string }): Promise<Employee> {
    if (!data.password) {
      throw new AppError(
        "Password is required to create employee",
        HttpStatusCode.BAD_REQUEST,
        "EmployeeService",
      )
    }

    const passwordHash = await HashUtil.hash(data.password)

    // Remove password from data before passing to repo
    const { password, ...repoData } = data

    try {
      return await this.repository.createEmployee({
        ...repoData,
        passwordHash,
      })
    } catch (error: any) {
      if (error.code === 11000 || error.code === "P2002") {
        throw new AppError(
          "Username, email, phone, or national ID already exists",
          HttpStatusCode.CONFLICT,
          "EmployeeService",
        )
      }
      throw error
    }
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null> {
    // Check if exists
    await this.getEmployee(id)

    const updated = await this.repository.updateEmployee(id, data)
    return updated
  }

  async updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null> {
    // Check if exists
    await this.getEmployee(id)

    const updated = await this.repository.updateStatus(id, status)
    return updated
  }

  async deleteEmployee(id: string): Promise<boolean> {
    // Check if exists
    await this.getEmployee(id)

    return this.repository.deleteEmployee(id)
  }
}
