import {
  EmployeeSalaryConfigWithTemplate,
  ICreateSalaryConfigDTO,
  IEmployeeSalaryConfigRepository,
} from "@/types/payroll.types.ts"

import { EmployeeSalaryConfig, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaEmployeeSalaryConfigRepository
  extends BaseRepository
  implements IEmployeeSalaryConfigRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findActiveByEmployee(
    employeeId: string,
    atDate: Date,
  ): Promise<EmployeeSalaryConfigWithTemplate | null> {
    return this.prisma.employeeSalaryConfig.findFirst({
      where: {
        employeeId,
        effectiveFrom: { lte: atDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: atDate } }],
      },
      include: {
        template: {
          include: {
            components: {
              include: {
                component: true,
              },
            },
          },
        },
      },
      orderBy: { effectiveFrom: "desc" },
    })
  }

  async findAllByEmployee(employeeId: string): Promise<EmployeeSalaryConfig[]> {
    return this.prisma.employeeSalaryConfig.findMany({
      where: { employeeId },
      orderBy: { effectiveFrom: "desc" },
      include: {
        template: true,
      },
    })
  }

  async create(
    data: ICreateSalaryConfigDTO & { employeeId: string; createdById: string },
  ): Promise<EmployeeSalaryConfig> {
    return this.prisma.employeeSalaryConfig.create({
      data: {
        employeeId: data.employeeId,
        templateId: data.templateId,
        baseSalary: data.baseSalary,
        effectiveFrom: data.effectiveFrom,
        note: data.note,
        customFields: data.customFields,
        createdById: data.createdById,
      },
    })
  }

  async closeCurrentConfig(employeeId: string, effectiveTo: Date): Promise<void> {
    await this.prisma.employeeSalaryConfig.updateMany({
      where: {
        employeeId,
        effectiveTo: null,
      },
      data: { effectiveTo },
    })
  }
}
