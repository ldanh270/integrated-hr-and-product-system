import { Employee, EmployeeDb, IEmployeeRepository } from "@/types"

import { Model } from "mongoose"

export class MongoEmployeeRepository implements IEmployeeRepository {
  constructor(private employeeModel: Model<EmployeeDb>) {}

  async listEmployees(): Promise<Employee[]> {
    const employees = await this.employeeModel.find().lean<EmployeeDb[]>()
    return employees.map((employee) => this.toEmployee(employee))
  }

  private toEmployee(employee: EmployeeDb): Employee {
    return {
      id: employee._id.toString(),
      fullName: employee.fullName,
      email: employee.email,
      role: employee.role,
      phone: employee.phone ?? null,
      position: employee.position ?? null,
      employeeType: employee.employeeType,
      status: employee.status,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    }
  }
}
