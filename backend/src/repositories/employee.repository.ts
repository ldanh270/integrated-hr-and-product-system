import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { SORT_ORDER } from "@/configs/system/db.config.ts"
import {
  CreateEmployeeDto,
  Employee,
  EmployeeListQuery,
  EmployeeStatus,
  IEmployeeRepository,
  PaginatedEmployeesDto,
  UpdateEmployeeDto,
} from "@/types"

import { Prisma, PrismaClient, Employee as PrismaEmployee } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for managing Employee data in PostgreSQL using Prisma.
 * Implements the IEmployeeRepository contract and extends BaseRepository.
 */
export class PrismaEmployeeRepository extends BaseRepository implements IEmployeeRepository {
  /**
   * Initializes the repository with the PrismaClient.
   * @param prisma The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Maps a database Prisma employee record to the application domain Employee type.
   * Ensures encapsulation and decouples database schemas from domain models.
   * @param employee The PrismaEmployee record from database.
   * @returns The mapped Employee domain object.
   * @protected
   */
  protected mapToDomain(employee: PrismaEmployee): Employee {
    return {
      id: employee.id,
      fullName: employee.fullName,
      username: employee.username,
      email: employee.email,
      role: employee.role,
      phone: employee.phone,
      position: employee.position,
      employeeType: employee.employeeType,
      status: employee.status,
      dateOfBirth: employee.dateOfBirth,
      nationalId: employee.nationalId,
      address: employee.address,
      startDate: employee.startDate,
      endDate: employee.endDate,
      avatar:
        employee.avatarUrl || employee.avatarId
          ? { url: employee.avatarUrl, id: employee.avatarId }
          : null,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    }
  }

  /**
   * Retrieves a paginated and filtered list of employees.
   * Excludes soft-deleted employees and defaults to excluding terminated employees unless specified.
   * @param query Filtering and pagination parameters.
   * @returns A paginated result containing employee data list and metadata.
   */
  async listEmployeesPaginated(query: EmployeeListQuery): Promise<PaginatedEmployeesDto> {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      role,
      employeeType,
      sortBy = "createdAt",
      sortOrder = SORT_ORDER.DESC,
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.EmployeeWhereInput = { deletedAt: null } as any

    // Apply text search on full name, email, or username (case-insensitive)
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ]
    }

    // Apply status filter, default to excluding terminated employees
    if (status) {
      where.status = status
    } else {
      where.status = { not: EMPLOYEE_STATUS.TERMINATED }
    }

    // Apply optional field filters
    if (role) where.role = role
    if (employeeType) where.employeeType = employeeType

    // Define ordering criteria dynamically
    const orderBy: Prisma.EmployeeOrderByWithRelationInput = {
      [sortBy]: sortOrder === SORT_ORDER.ASC ? SORT_ORDER.ASC : SORT_ORDER.DESC,
    }

    // Perform concurrent data fetching and count query
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ])

    return {
      data: data.map((employee) => this.mapToDomain(employee)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Finds an active employee by their unique ID.
   * Excludes soft-deleted records.
   * @param id The employee ID.
   * @returns The Employee domain object if found, otherwise null.
   */
  async findById(id: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null } as any,
    })
    if (!employee) return null
    return this.mapToDomain(employee)
  }

  /**
   * Persists a new employee record in the database.
   * @param data DTO containing the initial employee details along with their password hash.
   * @returns The newly created Employee domain object.
   */
  async createEmployee(data: CreateEmployeeDto & { passwordHash: string }): Promise<Employee> {
    const employee = await this.prisma.employee.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role,
        phone: data.phone,
        position: data.position,
        employeeType: data.employeeType,
        status: data.status,
        dateOfBirth:
          data.dateOfBirth !== undefined
            ? data.dateOfBirth === null
              ? null
              : new Date(data.dateOfBirth)
            : undefined,
        nationalId: data.nationalId,
        address: data.address,
        startDate:
          data.startDate !== undefined
            ? data.startDate === null
              ? null
              : new Date(data.startDate)
            : undefined,
      },
    })
    return this.mapToDomain(employee)
  }

  /**
   * Updates an existing employee's details.
   * @param id The ID of the employee to update.
   * @param data DTO containing partial updates.
   * @returns The updated Employee domain object, or null if update fails.
   */
  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null> {
    const updateData: Prisma.EmployeeUpdateInput = {
      fullName: data.fullName,
      phone: data.phone,
      position: data.position,
      employeeType: data.employeeType,
      status: data.status,
      dateOfBirth:
        data.dateOfBirth !== undefined
          ? data.dateOfBirth === null
            ? null
            : new Date(data.dateOfBirth)
          : undefined,
      nationalId: data.nationalId,
      address: data.address,
      startDate:
        data.startDate !== undefined
          ? data.startDate === null
            ? null
            : new Date(data.startDate)
          : undefined,
      endDate:
        data.endDate !== undefined
          ? data.endDate === null
            ? null
            : new Date(data.endDate)
          : undefined,
    }

    const employee = await this.prisma.employee.update({
      where: { id },
      data: updateData,
    })
    return this.mapToDomain(employee)
  }

  /**
   * Updates the status of an employee (e.g. active, inactive, on_leave).
   * @param id The ID of the employee.
   * @param status The new status value.
   * @returns The updated Employee domain object, or null if employee not found.
   */
  async updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null> {
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { status },
    })
    return this.mapToDomain(employee)
  }

  /**
   * Performs a soft delete on an employee record.
   * Marks the employee's status as terminated, records the deletion timestamp,
   * and anonymizes/prefixes unique identifier fields to prevent database constraint conflicts
   * if a new employee is created with the same credentials.
   * @param id The ID of the employee to delete.
   * @returns A boolean representing whether the soft delete succeeded.
   */
  async deleteEmployee(id: string): Promise<boolean> {
    const record = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null } as any,
    })
    if (!record) return false

    const timestamp = new Date().getTime()
    await this.prisma.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: EMPLOYEE_STATUS.TERMINATED,
        email: `deleted_${timestamp}_${record.email}`,
        username: `deleted_${timestamp}_${record.username}`,
        phone: record.phone ? `deleted_${timestamp}_${record.phone}` : null,
        nationalId: record.nationalId ? `deleted_${timestamp}_${record.nationalId}` : null,
      },
    })
    return true
  }
}
