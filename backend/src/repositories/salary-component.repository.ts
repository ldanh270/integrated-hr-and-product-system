import {
  ICreateSalaryComponentDTO,
  ISalaryComponentRepository,
  IUpdateSalaryComponentDTO,
} from "@/types/payroll.types.ts"

import { ComponentType, PrismaClient, SalaryComponent } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaSalaryComponentRepository
  extends BaseRepository
  implements ISalaryComponentRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(filter: { type?: ComponentType; isActive?: boolean }): Promise<SalaryComponent[]> {
    return this.prisma.salaryComponent.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    })
  }

  async findById(id: string): Promise<SalaryComponent | null> {
    return this.prisma.salaryComponent.findUnique({
      where: { id },
    })
  }

  async create(data: ICreateSalaryComponentDTO & { createdById: string }): Promise<SalaryComponent> {
    return this.prisma.salaryComponent.create({
      data: {
        name: data.name,
        type: data.type,
        formula: data.formula,
        description: data.description,
        createdById: data.createdById,
      },
    })
  }

  async update(id: string, data: IUpdateSalaryComponentDTO): Promise<SalaryComponent> {
    return this.prisma.salaryComponent.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.salaryComponent.update({
      where: { id },
      data: { isActive: false },
    })
  }
}
