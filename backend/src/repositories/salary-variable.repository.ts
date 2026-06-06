import {
  ICreateSalaryVariableDTO,
  ISalaryVariableRepository,
  IUpdateSalaryVariableDTO,
} from "@/types/payroll.types.ts"

import { PrismaClient, SalaryVariable } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaSalaryVariableRepository
  extends BaseRepository
  implements ISalaryVariableRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(filter?: { isActive?: boolean }): Promise<SalaryVariable[]> {
    return this.prisma.salaryVariable.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    })
  }

  async findById(id: string): Promise<SalaryVariable | null> {
    return this.prisma.salaryVariable.findUnique({
      where: { id },
    })
  }

  async findByCode(code: string): Promise<SalaryVariable | null> {
    return this.prisma.salaryVariable.findUnique({
      where: { code },
    })
  }

  async create(data: ICreateSalaryVariableDTO & { createdById: string }): Promise<SalaryVariable> {
    return this.prisma.salaryVariable.create({
      data: {
        code: data.code,
        name: data.name,
        value: data.value,
        description: data.description,
        createdById: data.createdById,
      },
    })
  }

  async update(id: string, data: IUpdateSalaryVariableDTO): Promise<SalaryVariable> {
    return this.prisma.salaryVariable.update({
      where: { id },
      data: {
        ...data,
      },
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.salaryVariable.update({
      where: { id },
      data: { isActive: false },
    })
  }
}
