import { EMPLOYEE_STATUS, ROLE } from "@/configs/entities/employee.config.ts"
import { ACTIVITY_ACTION, ACTIVITY_CATEGORY } from "@/configs/auth/auth.config.ts"
import { DB_ERROR_CODES } from "@/configs/system/db.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
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
import { IAuthRepository } from "@/types/auth.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

/**
 * Service for managing employee-related operations.
 */
export class EmployeeService implements IEmployeeService {
  /**
   * Creates a new EmployeeService instance.
   * @param repository - The employee repository implementation.
   * @param authRepository - The authentication repository for audit logging.
   */
  constructor(
    private repository: IEmployeeRepository,
    private authRepository?: IAuthRepository,
  ) {}

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
   * @param actorId - The ID of the employee performing the update.
   * @param ipAddress - The IP address from which the update is performed.
   * @returns The updated employee record or null.
   */
  async updateEmployee(
    id: string,
    data: UpdateEmployeeDto,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Employee | null> {
    // Check if exists and get current data for comparison
    const currentEmployee = await this.getEmployee(id)
    if (!currentEmployee) return null

    let passwordHash: string | undefined
    if (data.password) {
      passwordHash = await HashUtil.hash(data.password)
    }

    // Remove password from data
    const { password, ...updateData } = data

    const updated = await this.repository.updateEmployee(id, {
      ...updateData,
      passwordHash,
    })

    // Audit Role Change
    if (updated && this.authRepository && data.role && data.role !== currentEmployee.role) {
      const isRevoked = this.isRoleDowngrade(currentEmployee.role, data.role)

      await this.authRepository.logActivity({
        empId: id,
        category: ACTIVITY_CATEGORY.ROLE,
        actionType: isRevoked ? ACTIVITY_ACTION.ROLE_REVOKED : ACTIVITY_ACTION.ROLE_ASSIGNED,
        ipAddress,
        timestamp: new Date(),
        details: JSON.stringify({
          actorId,
          oldRole: currentEmployee.role,
          newRole: data.role,
          message: isRevoked ? "Role downgraded/changed" : "Role upgraded/assigned",
        }),
      })
    }

    return updated
  }

  /**
   * Updates an employee's status (e.g., active, inactive).
   * @param id - The employee ID.
   * @param status - The new status.
   * @param actorId - The ID of the employee performing the update.
   * @param ipAddress - The IP address from which the update is performed.
   * @returns The updated employee record or null.
   */
  async updateStatus(
    id: string,
    status: EmployeeStatus,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Employee | null> {
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

  /**
   * Returns a flat list of employees who hold approver-eligible roles.
   * Used to populate the "Người duyệt đơn" dropdown in the application form.
   * @returns List of approver employees with minimal fields.
   */
  async listApprovers(): Promise<{ id: string; fullName: string; role: string; position: string | null }[]> {
    const APPROVER_ROLES = [ROLE.ADMIN, ROLE.GENERAL_MANAGER, ROLE.HR_MANAGER, ROLE.TEAM_LEADER] as any[]
    return prisma.employee.findMany({
      where: {
        role: { in: APPROVER_ROLES },
        status: EMPLOYEE_STATUS.ACTIVE,
        deletedAt: null,
      },
      select: { id: true, fullName: true, role: true, position: true },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    })
  }

  /**
   * Helper to handle and format database unique constraint errors.
   */
  private isRoleDowngrade(oldRole: string, newRole: string): boolean {
    const roleHierarchy: Record<string, number> = {
      admin: 100,
      general_manager: 80,
      hr_manager: 60,
      team_leader: 40,
      employee: 20,
    }

    return (roleHierarchy[newRole] || 0) < (roleHierarchy[oldRole] || 0)
  }
}
