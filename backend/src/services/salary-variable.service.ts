import { AppError } from "@/utils/error.util.ts"
import {
  ICreateSalaryVariableDTO,
  ISalaryVariableRepository,
  ISalaryVariableService,
  IUpdateSalaryVariableDTO,
} from "@/types/payroll.types.ts"
import { SalaryVariable } from "@prisma/client"

export class SalaryVariableService implements ISalaryVariableService {
  constructor(private readonly repo: ISalaryVariableRepository) {}

  async listVariables(filter?: { isActive?: boolean }): Promise<SalaryVariable[]> {
    return this.repo.findAll(filter)
  }

  async getVariable(id: string): Promise<SalaryVariable> {
    const variable = await this.repo.findById(id)
    if (!variable) {
      throw new AppError("Salary variable not found", 404, "Service")
    }
    return variable
  }

  async createVariable(
    data: ICreateSalaryVariableDTO,
    createdById: string,
  ): Promise<SalaryVariable> {
    // check if code exists
    const existing = await this.repo.findByCode(data.code)
    if (existing) {
      throw new AppError("Salary variable with this code already exists", 400, "Service")
    }

    return this.repo.create({ ...data, createdById })
  }

  async updateVariable(
    id: string,
    data: IUpdateSalaryVariableDTO,
  ): Promise<SalaryVariable> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new AppError("Salary variable not found", 404, "Service")
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repo.findByCode(data.code)
      if (codeExists) {
        throw new AppError("Salary variable with this code already exists", 400, "Service")
      }
    }

    return this.repo.update(id, data)
  }

  async deleteVariable(id: string): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new AppError("Salary variable not found", 404, "Service")
    }

    await this.repo.softDelete(id)
  }
}
