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

import { Model, PipelineStage } from "mongoose"

export class MongoEmployeeRepository implements IEmployeeRepository {
  constructor(private employeeModel: Model<EmployeeDb>) {}

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
      this.employeeModel.find(filter).sort(sortObject).skip(skip).limit(limit).lean<EmployeeDb[]>(),
      this.employeeModel.countDocuments(filter),
    ])

    return {
      data: data.map((employee) => this.toEmployee(employee)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string): Promise<Employee | null> {
    const employee = await this.employeeModel.findById(id).lean<EmployeeDb>()
    if (!employee) return null
    return this.toEmployee(employee)
  }

  async createEmployee(data: CreateEmployeeDto & { passwordHash: string }): Promise<Employee> {
    const newEmployee = new this.employeeModel(data)
    const saved = await newEmployee.save()
    return this.toEmployee(saved.toObject())
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee | null> {
    const updated = await this.employeeModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean<EmployeeDb>()

    if (!updated) return null
    return this.toEmployee(updated)
  }

  async updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null> {
    const updated = await this.employeeModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .lean<EmployeeDb>()

    if (!updated) return null
    return this.toEmployee(updated)
  }

  private toEmployee(employee: EmployeeDb): Employee {
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
      avatar: employee.avatar ? { url: employee.avatar.url ?? null, id: employee.avatar.id ?? null } : null,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    }
  }
}
