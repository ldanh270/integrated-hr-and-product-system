import { PAYROLL_MESSAGES } from "@/configs/messages/payroll.message"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  IBulkAssignSalaryTemplateDTO,
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

  /**
   * Retrieve the active salary configuration for the employee at a specific time (defaults to current).
   *
   * @param employeeId - The employeeId parameter
   * @param atDate - The atDate parameter (optional)
   * @returns Returns the result of type Promise<{ id: string; employeeId: string; templateId: string; baseSalary: Decimal; effectiveFrom: Date; effectiveTo: Date | null; note: string | null; createdById: string; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
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

  /**
   * Retrieve the configuration history for the employee.
   *
   * @param employeeId - The employeeId parameter
   * @returns Returns the result of type Promise<{ id: string; employeeId: string; templateId: string; baseSalary: Decimal; effectiveFrom: Date; effectiveTo: Date | null; note: string | null; createdById: string; createdAt: Date; updatedAt: Date; }[]>
   */
  async getConfigHistory(employeeId: string): Promise<EmployeeSalaryConfig[]> {
    return this.configRepo.findAllByEmployee(employeeId)
  }

  /**
   * Assign a new salary configuration to the employee.
   *
   * @param employeeId - The employeeId parameter
   * @param data - The data parameter
   * @param createdById - The createdById parameter
   * @returns Returns the result of type Promise<{ id: string; employeeId: string; templateId: string; baseSalary: Decimal; effectiveFrom: Date; effectiveTo: Date | null; note: string | null; createdById: string; createdAt: Date; updatedAt: Date; }>
   */
  async assignConfig(
    employeeId: string,
    data: ICreateSalaryConfigDTO,
    createdById: string,
  ): Promise<EmployeeSalaryConfig> {
    return this.prisma.$transaction(async (tx) => {
      // Salary config ranges are day-based; the previous active range ends the day before this one.
      const effectiveTo = new Date(data.effectiveFrom)
      effectiveTo.setDate(effectiveTo.getDate() - 1)

      // Close and create inside one transaction so employees never see overlapping active configs.
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

  async bulkAssignTemplate(
    data: IBulkAssignSalaryTemplateDTO,
    createdById: string,
  ): Promise<{ assignedCount: number }> {
    return this.prisma.$transaction(async (tx) => {
      const employeeIds = Array.from(new Set(data.employeeIds))
      const template = await tx.payslipTemplate.findFirst({
        where: { id: data.templateId, isActive: true },
        select: { id: true },
      })
      if (!template) {
        throw new AppError(
          PAYROLL_MESSAGES.ERRORS.TEMPLATE_NOT_FOUND_UPDATE,
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        )
      }

      const employees = await tx.employee.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true },
      })
      if (employees.length !== employeeIds.length) {
        throw new AppError(
          "Một số nhân viên không tồn tại",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }

      // Close the currently active range the day before the new template takes effect.
      const effectiveTo = new Date(data.effectiveFrom)
      effectiveTo.setDate(effectiveTo.getDate() - 1)

      const activeConfigs = await tx.employeeSalaryConfig.findMany({
        where: {
          employeeId: { in: employeeIds },
          effectiveFrom: { lte: data.effectiveFrom },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: data.effectiveFrom } }],
        },
        orderBy: { effectiveFrom: "desc" },
      })
      // Preserve existing base salary per employee; defaultBaseSalary only fills first-time configs.
      const activeByEmployee = new Map(activeConfigs.map((config) => [config.employeeId, config]))

      await tx.employeeSalaryConfig.updateMany({
        where: { id: { in: activeConfigs.map((config) => config.id) } },
        data: { effectiveTo },
      })

      await tx.employeeSalaryConfig.createMany({
        data: employeeIds.map((employeeId) => ({
          employeeId,
          templateId: data.templateId,
          baseSalary: activeByEmployee.get(employeeId)?.baseSalary ?? data.defaultBaseSalary,
          effectiveFrom: data.effectiveFrom,
          note: data.note,
          createdById,
        })),
      })

      return { assignedCount: employeeIds.length }
    })
  }
}
