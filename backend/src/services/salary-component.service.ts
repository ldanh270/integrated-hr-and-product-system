import { PAYROLL_MESSAGES } from "@/configs/messages/payroll.message"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import {
  ICreateSalaryComponentDTO,
  IFormulaContext,
  ISalaryComponentRepository,
  ISalaryComponentService,
  IUpdateSalaryComponentDTO,
} from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { ComponentType, SalaryComponent } from "@prisma/client"
import * as math from "mathjs"

export class SalaryComponentService implements ISalaryComponentService {
  constructor(private componentRepo: ISalaryComponentRepository) {}

  /**
   * Process business logic for listComponents.
   *
   * @param filter - The filter parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; code: string; type: $Enums.ComponentType; valueType: $Enums.ComponentValueType; formula: string; description: string | null; isActive: boolean; createdById: string; createdAt: Date; updatedAt: Date; }[]>
   */
  async listComponents(filter: {
    type?: ComponentType
    isActive?: boolean
  }): Promise<SalaryComponent[]> {
    return this.componentRepo.findAll(filter)
  }

  /**
   * Process business logic for createComponent.
   *
   * @param data - The data parameter
   * @param createdById - The createdById parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; code: string; type: $Enums.ComponentType; valueType: $Enums.ComponentValueType; formula: string; description: string | null; isActive: boolean; createdById: string; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async createComponent(
    data: ICreateSalaryComponentDTO,
    createdById: string,
  ): Promise<SalaryComponent> {
    const { valid, error } = await this.validateFormula(data.formula)
    if (!valid) {
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.INVALID_FORMULA(error || "Unknown error"),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }
    return this.componentRepo.create({ ...data, createdById })
  }

  /**
   * Process business logic for updateComponent.
   *
   * @param id - The id parameter
   * @param data - The data parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; code: string; type: $Enums.ComponentType; valueType: $Enums.ComponentValueType; formula: string; description: string | null; isActive: boolean; createdById: string; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async updateComponent(id: string, data: IUpdateSalaryComponentDTO): Promise<SalaryComponent> {
    if (data.formula) {
      const { valid, error } = await this.validateFormula(data.formula)
      if (!valid) {
        throw new AppError(
          PAYROLL_MESSAGES.ERRORS.INVALID_FORMULA(error || "Unknown error"),
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }
    }
    return this.componentRepo.update(id, data)
  }

  /**
   * Delete a salary component from the system configuration.
   *
   * @param id - The id parameter
   * @returns Returns nothing (void)
   */
  async deleteComponent(id: string): Promise<void> {
    return this.componentRepo.softDelete(id)
  }

  /**
   * Analyze and validate the mathematical salary calculation formula.
   *
   * @param formula - The formula parameter
   * @returns Returns the result of type Promise<{ valid: boolean; error?: string | undefined; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async validateFormula(formula: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const globalVariables = await prisma.salaryVariable.findMany({
        where: { isActive: true },
      })
      const variablesContext: Record<string, number> = {}
      globalVariables.forEach((v: any) => {
        variablesContext[v.code] = Number(v.value)
      })

      const testContext: IFormulaContext | any = {
        baseSalary: 10_000_000,
        workingDays: 22,
        absentDays: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        holidayDays: 0,
        ...variablesContext,
      }

      const result = math.evaluate(formula, testContext)
      if (typeof result !== "number" || isNaN(result)) {
        throw new AppError(
          PAYROLL_MESSAGES.ERRORS.FORMULA_MUST_BE_NUMBER,
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }
      return { valid: true }
    } catch (e: any) {
      return { valid: false, error: e.message }
    }
  }
}
