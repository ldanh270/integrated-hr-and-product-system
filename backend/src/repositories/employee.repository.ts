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

export class PrismaEmployeeRepository extends BaseRepository implements IEmployeeRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

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

  async listEmployeesPaginated(query: EmployeeListQuery): Promise<PaginatedEmployeesDto> {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      role,
      employeeType,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.EmployeeWhereInput = { deletedAt: null } as any

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) where.status = status
    if (role) where.role = role
    if (employeeType) where.employeeType = employeeType

    const orderBy: Prisma.EmployeeOrderByWithRelationInput = {
      [sortBy]: sortOrder === "asc" ? "asc" : "desc",
    }

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

  async findById(id: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null } as any,
    })
    if (!employee) return null
    return this.mapToDomain(employee)
  }

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
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        nationalId: data.nationalId,
        address: data.address,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      },
    })
    return this.mapToDomain(employee)
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null> {
    const updateData: Prisma.EmployeeUpdateInput = {
      fullName: data.fullName,
      phone: data.phone,
      position: data.position,
      employeeType: data.employeeType,
      status: data.status,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      nationalId: data.nationalId,
      address: data.address,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    }

    const employee = await this.prisma.employee.update({
      where: { id },
      data: updateData,
    })
    return this.mapToDomain(employee)
  }

  async updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null> {
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { status },
    })
    return this.mapToDomain(employee)
  }

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
        status: "terminated",
        email: `deleted_${timestamp}_${record.email}`,
        username: `deleted_${timestamp}_${record.username}`,
        phone: record.phone ? `deleted_${timestamp}_${record.phone}` : null,
        nationalId: record.nationalId ? `deleted_${timestamp}_${record.nationalId}` : null,
      },
    })
    return true
  }
}
