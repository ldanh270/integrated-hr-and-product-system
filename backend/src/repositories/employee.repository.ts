import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { SORT_ORDER } from "@/configs/system/db.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  AppRole,
  CreateEmployeeDto,
  Employee,
  EmployeeListQuery,
  EmployeeStatus,
  IEmployeeRepository,
  PaginatedEmployeesDto,
  UpdateEmployeeDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { Prisma, PrismaClient, Employee as PrismaEmployee } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

type EmployeeRoleSummary = {
  role: {
    id: string
    name: string
  }
}

type EmployeeWithRoles = PrismaEmployee & {
  employeeRoles?: EmployeeRoleSummary[]
}

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
  protected mapToDomain(employee: EmployeeWithRoles): Employee {
    const roles = employee.employeeRoles?.map((employeeRole) => employeeRole.role.name) ?? []

    return {
      id: employee.id,
      fullName: employee.fullName,
      username: employee.username,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      positionId: employee.positionId,
      employeeType: employee.employeeType,
      status: employee.status,
      dateOfBirth: employee.dateOfBirth,
      nationalId: employee.nationalId,
      address: employee.address,
      startDate: employee.startDate,
      endDate: employee.endDate,
      role: roles[0] ?? null,
      roles,
      avatar:
        employee.avatarUrl || employee.avatarId
          ? { url: employee.avatarUrl, id: employee.avatarId }
          : null,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      version: employee.version,
      authorizationVersion: employee.authorizationVersion,
      lockedUntil: employee.lockedUntil,
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
      type: employeeType,
      roleId,
      sortBy = "createdAt",
      sortOrder = SORT_ORDER.DESC,
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.EmployeeWhereInput = { deletedAt: null } as any

    // Apply role filter if provided
    if (roleId) {
      where.employeeRoles = {
        some: {
          roleId,
        },
      }
    }

    // Apply text search on full name, email, or username (case-insensitive)
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ]
    }

    // Apply status filter, default to excluding terminated employees
    if (status === "locked") {
      const now = new Date()
      where.OR = [
        { lockedUntil: { gt: now } },
        { failedLoginCount: { gte: 5 } },
      ]
    } else if (status) {
      where.status = status as EmployeeStatus
    } else {
      where.status = { not: EMPLOYEE_STATUS.TERMINATED }
    }

    // Apply optional field filters
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
        include: {
          employeeRoles: {
            where: {
              role: {
                deletedAt: null,
                isActive: true,
              },
            },
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        skip: Number(skip),
        take: Number(limit),
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
      include: {
        employeeRoles: {
          where: {
            role: {
              deletedAt: null,
              isActive: true,
            },
          },
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
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
        phone: data.phone,
        position: data.position,
        positionId: data.positionId,
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
        employeeRoles: data.roleId
          ? {
              create: {
                roleId: data.roleId,
              },
            }
          : undefined,
      },
      include: {
        employeeRoles: {
          where: {
            role: {
              deletedAt: null,
              isActive: true,
            },
          },
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
  async updateEmployee(
    id: string,
    data: Omit<UpdateEmployeeDto, "password"> & { passwordHash?: string },
  ): Promise<Employee | null> {
    const updateData: any = {
      fullName: data.fullName,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      phone: data.phone,
      position: data.position,
      positionId: data.positionId,
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
      include: {
        employeeRoles: {
          where: {
            role: {
              deletedAt: null,
              isActive: true,
            },
          },
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
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
      include: {
        employeeRoles: {
          where: {
            role: {
              deletedAt: null,
              isActive: true,
            },
          },
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
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

  /**
   * Maps a Prisma role record to the application AppRole type.
   */
  private mapRoleToDomain(role: any): AppRole {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      isAdministrative: role.isAdministrative,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      createdBy: role.createdBy,
      updatedBy: role.updatedBy,
      deletedAt: role.deletedAt,
    }
  }

  /**
   * Retrieves all active roles assigned to a specific employee.
   */
  async findRolesByEmployeeId(employeeId: string): Promise<AppRole[]> {
    const employeeRoles = await this.prisma.employeeRole.findMany({
      where: {
        employeeId,
        role: {
          deletedAt: null,
        },
      },
      include: {
        role: true,
      },
    })
    return employeeRoles.map((er) => this.mapRoleToDomain(er.role))
  }

  /**
   * Assigns a role to an employee if assignment does not already exist.
   */
  async assignRole(
    employeeId: string,
    roleId: string,
    actorId?: string,
  ): Promise<{ success: boolean; created: boolean }> {
    const existing = await this.prisma.employeeRole.findUnique({
      where: {
        employeeId_roleId: {
          employeeId,
          roleId,
        },
      },
    })
    if (existing) {
      return { success: true, created: false }
    }
    await this.prisma.employeeRole.create({
      data: {
        employeeId,
        roleId,
        assignedBy: actorId,
      },
    })
    return { success: true, created: true }
  }

  /**
   * Revokes an existing role assignment from an employee.
   */
  async revokeRole(employeeId: string, roleId: string): Promise<boolean> {
    const existing = await this.prisma.employeeRole.findUnique({
      where: {
        employeeId_roleId: {
          employeeId,
          roleId,
        },
      },
    })
    if (!existing) {
      return false
    }
    await this.prisma.employeeRole.delete({
      where: {
        employeeId_roleId: {
          employeeId,
          roleId,
        },
      },
    })
    return true
  }

  /**
   * Replaces all role assignments for an employee using optimistic concurrency.
   */
  async updateRoles(
    employeeId: string,
    roleIds: string[],
    version: number,
    actorId?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Acquire AdminStateLock row for update
      await tx.$executeRaw`
        INSERT INTO admin_state_lock (id) VALUES (1) ON CONFLICT (id) DO NOTHING
      `
      await tx.$executeRaw`
        SELECT id FROM admin_state_lock WHERE id = 1 FOR UPDATE
      `

      // Verify employee matching version concurrency
      const emp = await tx.employee.findFirst({
        where: { id: employeeId, version, deletedAt: null },
      })
      if (!emp) {
        throw new AppError(
          "CONCURRENT_MODIFICATION",
          HttpStatusCode.CONFLICT,
          "EmployeeRepository",
          "CONCURRENT_MODIFICATION",
        )
      }

      // Mutate mappings: Delete existing and insert new
      await tx.employeeRole.deleteMany({
        where: { employeeId },
      })

      if (roleIds.length > 0) {
        await tx.employeeRole.createMany({
          data: roleIds.map((roleId) => ({
            employeeId,
            roleId,
            assignedBy: actorId,
          })),
        })
      }

      // Increment employee version
      await tx.employee.update({
        where: { id: employeeId },
        data: {
          version: { increment: 1 },
        },
      })

      // Count active administrators
      const adminCount = await tx.employee.count({
        where: {
          status: "active",
          deletedAt: null,
          employeeRoles: {
            some: {
              role: {
                isAdministrative: true,
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      })

      if (adminCount === 0) {
        throw new AppError(
          "CANNOT_REMOVE_LAST_ADMIN",
          HttpStatusCode.CONFLICT,
          "EmployeeRepository",
        )
      }
    })
  }

  /**
   * Counts all active employees holding an active administrative role.
   */
  async countActiveAdmins(tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx || this.prisma
    return client.employee.count({
      where: {
        status: "active",
        deletedAt: null,
        employeeRoles: {
          some: {
            role: {
              isAdministrative: true,
              isActive: true,
              deletedAt: null,
            },
          },
        },
      },
    })
  }
}
