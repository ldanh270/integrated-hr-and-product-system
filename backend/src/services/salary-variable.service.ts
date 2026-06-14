import { PAYROLL_MESSAGES } from "@/configs/messages/payroll.message"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ICreateSalaryVariableDTO,
  ISalaryVariableRepository,
  ISalaryVariableService,
  IUpdateSalaryVariableDTO,
} from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { SalaryVariable } from "@prisma/client"

export class SalaryVariableService implements ISalaryVariableService {
  constructor(private readonly repo: ISalaryVariableRepository) {}

  async listVariables(filter?: { isActive?: boolean }): Promise<SalaryVariable[]> {
    return this.repo.findAll(filter)
  }

  async getVariable(id: string): Promise<SalaryVariable> {
    const variable = await this.repo.findById(id)
    if (!variable) {
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.SALARY_VARIABLE_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
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
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.SALARY_VARIABLE_EXISTS,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    return this.repo.create({ ...data, createdById })
  }

  async updateVariable(id: string, data: IUpdateSalaryVariableDTO): Promise<SalaryVariable> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.SALARY_VARIABLE_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repo.findByCode(data.code)
      if (codeExists) {
        throw new AppError(
          PAYROLL_MESSAGES.ERRORS.SALARY_VARIABLE_EXISTS,
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }
    }

    return this.repo.update(id, data)
  }

  async deleteVariable(id: string): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.SALARY_VARIABLE_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    await this.repo.softDelete(id)
  }
}
