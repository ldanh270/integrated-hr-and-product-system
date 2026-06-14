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

  /**
   * Process business logic for listVariables.
   *
   * @param filter - The filter parameter (optional)
   * @returns Returns the result of type Promise<{ name: string; id: string; code: string; value: Decimal; description: string | null; isActive: boolean; createdById: string; createdAt: Date; updatedAt: Date; }[]>
   */
  async listVariables(filter?: { isActive?: boolean }): Promise<SalaryVariable[]> {
    return this.repo.findAll(filter)
  }

  /**
   * Process business logic for getVariable.
   *
   * @param id - The id parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; code: string; value: Decimal; description: string | null; isActive: boolean; createdById: string; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
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

  /**
   * Process business logic for createVariable.
   *
   * @param data - The data parameter
   * @param createdById - The createdById parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; code: string; value: Decimal; description: string | null; isActive: boolean; createdById: string; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
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

  /**
   * Process business logic for updateVariable.
   *
   * @param id - The id parameter
   * @param data - The data parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; code: string; value: Decimal; description: string | null; isActive: boolean; createdById: string; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
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

  /**
   * Delete a salary variable from the system configuration.
   *
   * @param id - The id parameter
   * @returns Returns nothing (void)
   * @throws AppError if a business logic error occurs or data is not found
   */
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
