import {
  ICreateSalaryComponentDTO,
  ISalaryComponentRepository,
  ISalaryComponentService,
  IUpdateSalaryComponentDTO,
  IFormulaContext,
} from "@/types/payroll.types.ts"

import { ComponentType, SalaryComponent } from "@prisma/client"
import * as math from "mathjs"

export class SalaryComponentService implements ISalaryComponentService {
  constructor(private componentRepo: ISalaryComponentRepository) {}

  async listComponents(filter: {
    type?: ComponentType
    isActive?: boolean
  }): Promise<SalaryComponent[]> {
    return this.componentRepo.findAll(filter)
  }

  async createComponent(
    data: ICreateSalaryComponentDTO,
    createdById: string,
  ): Promise<SalaryComponent> {
    const { valid, error } = await this.validateFormula(data.formula)
    if (!valid) {
      throw new Error(`Invalid formula: ${error}`)
    }
    return this.componentRepo.create({ ...data, createdById })
  }

  async updateComponent(id: string, data: IUpdateSalaryComponentDTO): Promise<SalaryComponent> {
    if (data.formula) {
      const { valid, error } = await this.validateFormula(data.formula)
      if (!valid) {
        throw new Error(`Invalid formula: ${error}`)
      }
    }
    return this.componentRepo.update(id, data)
  }

  async deleteComponent(id: string): Promise<void> {
    return this.componentRepo.softDelete(id)
  }

  async validateFormula(formula: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const testContext: IFormulaContext = {
        baseSalary: 10_000_000,
        mealAllowance: 500_000,
        transportAllowance: 0,
        housingAllowance: 0,
        phoneAllowance: 0,
        responsibilityAllowance: 0,
        seniorityAllowance: 0,
        standardDays: 22,
        workingDays: 22,
        absentDays: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        holidayDays: 0,
      }
      const result = math.evaluate(formula, testContext)
      if (typeof result !== "number" || isNaN(result)) {
        throw new Error("Formula must return a number")
      }
      return { valid: true }
    } catch (e: any) {
      return { valid: false, error: e.message }
    }
  }
}
