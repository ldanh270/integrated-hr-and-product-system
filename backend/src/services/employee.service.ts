import { DB_ERROR_CODES } from "@/configs/system/db.config.ts"
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

/**
 * Service for managing employee-related operations.
 */
export class EmployeeService implements IEmployeeService {
  /**
   * Creates a new EmployeeService instance.
   * @param repository - The employee repository implementation.
   */
  constructor(private repository: IEmployeeRepository) {}

  /**
   * Lists employees with pagination and filtering based on the provided query.
   * @param query - The list query parameters.
   * @returns A paginated result of employees.
   */
  async listEmployees(query: EmployeeListQuery): Promise<PaginatedEmployeesDto> {
    return this.repository.listEmployeesPaginated(query)
  }

  /**
   * Fetches a single employee by their ID.
   * @param id - The employee ID.
   * @returns The employee record or null if not found.
   * @throws {AppError} If the employee is not found.
   */
  async getEmployee(id: string): Promise<Employee | null> {
    const employee = await this.repository.findById(id)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "EmployeeService")
    }
    return employee
  }

  /**
   * Creates a new employee record and hashes their password.
   * @param data - The employee data including a plaintext password.
   * @returns The created employee record.
   * @throws {AppError} If password is missing or if a unique constraint is violated.
   */
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
      if (DB_ERROR_CODES.UNIQUE_CONSTRAINT.includes(error.code)) {
        throw new AppError(
          "Username, email, phone, or national ID already exists",
          HttpStatusCode.CONFLICT,
          "EmployeeService",
        )
      }
      throw error
    }
  }

  /**
   * Updates an existing employee's information.
   * @param id - The employee ID.
   * @param data - The updated employee data.
   * @returns The updated employee record or null.
   */
  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null> {
    // Check if exists
    await this.getEmployee(id)

    const updated = await this.repository.updateEmployee(id, data)
    return updated
  }

  /**
   * Updates an employee's status (e.g., active, inactive).
   * @param id - The employee ID.
   * @param status - The new status.
   * @returns The updated employee record or null.
   */
  async updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null> {
    // Check if exists
    await this.getEmployee(id)

    const updated = await this.repository.updateStatus(id, status)
    return updated
  }

  /**
   * Deletes an employee from the system.
   * @param id - The employee ID.
   * @returns True if deletion was successful.
   */
  async deleteEmployee(id: string): Promise<boolean> {
    // Check if exists
    await this.getEmployee(id)

    return this.repository.deleteEmployee(id)
  }
}
