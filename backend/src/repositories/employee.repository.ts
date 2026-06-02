import {
  CreateEmployeeDto,
  Employee,
  EmployeeDb,
  EmployeeListQuery,
  EmployeeStatus,
  IEmployeeRepository,
  PaginatedEmployeesDto,
  UpdateEmployeeDto,
} from "@/types"

import { Model } from "mongoose"

import { BaseRepository } from "./base.repository.ts"

export class MongoEmployeeRepository
  extends BaseRepository<EmployeeDb, Employee>
  implements IEmployeeRepository
{
  constructor(employeeModel: Model<EmployeeDb>) {
    super(employeeModel)
  }

  protected mapToDomain(employee: EmployeeDb): Employee {
    return {
      id: employee._id.toString(),
      fullName: employee.fullName,
      username: employee.username,
      email: employee.email,
      role: employee.role,
      phone: employee.phone ?? null,
      position: employee.position ?? null,
      employeeType: employee.employeeType,
      status: employee.status,
      dateOfBirth: employee.dateOfBirth ?? null,
      nationalId: employee.nationalId ?? null,
      address: employee.address ?? null,
      startDate: employee.startDate ?? null,
      endDate: employee.endDate ?? null,
      avatar: employee.avatar
        ? { url: employee.avatar.url ?? null, id: employee.avatar.id ?? null }
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
    const filter: any = {}

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ]
    }

    if (status) filter.status = status
    if (role) filter.role = role
    if (employeeType) filter.employeeType = employeeType

    const sortObject: any = { [sortBy]: sortOrder === "asc" ? 1 : -1 }

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sortObject).skip(skip).limit(limit).lean<EmployeeDb[]>(),
      this.model.countDocuments(filter),
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

  async createEmployee(data: CreateEmployeeDto & { passwordHash: string }): Promise<Employee> {
    return this.create(data)
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null> {
    return this.update(id, data)
  }

  async updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null> {
    return this.update(id, { status })
  }
}
