import { PAYROLL_MESSAGES } from "@/configs/messages/payroll.message"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ICreateSalaryConfigDTO,
  IEmployeeSalaryConfigRepository,
  IEmployeeSalaryConfigService,
} from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { EmployeeSalaryConfig } from "@prisma/client"
import { PrismaClient } from "@prisma/client"

export class EmployeeSalaryConfigService implements IEmployeeSalaryConfigService {
  constructor(
    private configRepo: IEmployeeSalaryConfigRepository,
    private prisma: PrismaClient,
  ) {}

  async getActiveConfig(employeeId: string, atDate?: Date): Promise<EmployeeSalaryConfig> {
    const date = atDate || new Date()
    const config = await this.configRepo.findActiveByEmployee(employeeId, date)
    if (!config)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.SALARY_CONFIG_NOT_FOUND(employeeId),
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    return config
  }

  async getConfigHistory(employeeId: string): Promise<EmployeeSalaryConfig[]> {
    return this.configRepo.findAllByEmployee(employeeId)
  }

  async assignConfig(
    employeeId: string,
    data: ICreateSalaryConfigDTO,
    createdById: string,
  ): Promise<EmployeeSalaryConfig> {
    return this.prisma.$transaction(async (tx) => {
      // effectiveFrom of new config minus 1 ms or 1 day. Prisma DateTime can handle milliseconds.
      // For simplicity, we just use the date of effectiveFrom, but maybe minus 1 day.
      const effectiveTo = new Date(data.effectiveFrom)
      effectiveTo.setDate(effectiveTo.getDate() - 1)

      // We actually need to execute the closeCurrentConfig in transaction, but configRepo is likely using the outer prisma
      // unless we pass tx. For now, we update directly using tx here or ensure repository supports transactions.
      // Since BaseRepository doesn't inject tx seamlessly by default, we do the manual query:
      await tx.employeeSalaryConfig.updateMany({
        where: { employeeId, effectiveTo: null },
        data: { effectiveTo },
      })

      return tx.employeeSalaryConfig.create({
        data: {
          employeeId,
          templateId: data.templateId,
          baseSalary: data.baseSalary,
          effectiveFrom: data.effectiveFrom,
          note: data.note,

          createdById,
        },
      })
    })
  }
}
