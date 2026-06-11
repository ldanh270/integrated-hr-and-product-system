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
import { handleDbUniqueError } from "@/utils/db-error.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

/**
 * Service class implementing the application business logic for Employee management.
 * Relies on the database abstraction layer (IEmployeeRepository) using Dependency Injection.
 */
export class EmployeeService implements IEmployeeService {
  /**
   * Initializes the service with the employee repository.
   * Constructor injection guarantees interface-based coupling.
   * @param repository The abstraction of database query/actions for Employee.
   */
  constructor(private repository: IEmployeeRepository) {}

  /**
   * Fetches page-segmented employees matching criteria.
   * @param query The page size, search criteria, sorting columns, etc.
   * @returns Paginated results containing metadata and employee list.
   */
  async listEmployees(query: EmployeeListQuery): Promise<PaginatedEmployeesDto> {
    return this.repository.listEmployeesPaginated(query)
  }

  /**
   * Retrieves an employee by their ID. Throws an application error if not found.
   * @param id Employee UUID string.
   * @returns The Employee details if found.
   * @throws AppError 404 if the employee does not exist.
   */
  async getEmployee(id: string): Promise<Employee | null> {
    const employee = await this.repository.findById(id)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "EmployeeService")
    }
    return employee
  }

  /**
   * Creates a new employee after hashing the provided password.
   * Catches unique constraint errors (like duplicate emails/usernames) and maps to structured HTTP conflicts.
   * @param data Details to create the employee record.
   * @returns The newly created employee domain instance.
   * @throws AppError 400 if password is missing.
   * @throws AppError 490 (CONFLICT) if email/username already exists.
   */
  async createEmployee(data: CreateEmployeeDto & { password?: string }): Promise<Employee> {
    if (!data.password) {
      throw new AppError(
        "Password is required to create employee",
        HttpStatusCode.BAD_REQUEST,
        "EmployeeService",
      )
    }

    // Hash the password asynchronously using bcrypt
    const passwordHash = await HashUtil.hash(data.password)

    // Exclude raw password from the DTO payload sent to the repository layer
    const { password, ...repoData } = data

    try {
      return await this.repository.createEmployee({
        ...repoData,
        passwordHash,
      })
    } catch (error: any) {
      this.handleDbError(error)
    }
  }

  /**
   * Partially updates employee info. Validates the existence of the employee beforehand.
   * @param id Employee ID string.
   * @param data Fields to update.
   * @returns The updated employee entity, or null.
   */
  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null> {
    // Check if employee exists first; throws 404 otherwise
    await this.getEmployee(id)

    try {
      const updated = await this.repository.updateEmployee(id, data)
      return updated
    } catch (error: any) {
      this.handleDbError(error)
    }
  }

  /**
   * Updates an employee's status field (e.g. active, inactive).
   * Validates existence prior to updating.
   * @param id Employee ID.
   * @param status Target status type.
   * @returns The updated employee entity, or null.
   */
  async updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null> {
    // Validate employee existence; throws 404 if absent
    await this.getEmployee(id)

    const updated = await this.repository.updateStatus(id, status)
    return updated
  }

  /**
   * Soft deletes an employee by setting status to terminated.
   * @param id The employee ID.
   * @returns A boolean signaling execution success.
   */
  async deleteEmployee(id: string): Promise<boolean> {
    // Verify existence of record; throws 404 if not found
    await this.getEmployee(id)

    return this.repository.deleteEmployee(id)
  }

  /**
   * Helper to handle and format database unique constraint errors.
   */
  private handleDbError(error: any): never {
    handleDbUniqueError(
      error,
      "EmployeeService",
      {
        username: "Username",
        email: "Email",
        phone: "Phone number",
        nationalId: "National ID",
      },
      "Username, email, phone, or national ID already exists",
    )
  }
}
