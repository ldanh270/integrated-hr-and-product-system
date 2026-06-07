import {
  ICreatePayslipTemplateDTO,
  IPayslipTemplateRepository,
  IUpdatePayslipTemplateDTO,
  PayslipTemplateWithComponents,
} from "@/types/payroll.types.ts"

import { PayslipTemplate, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaPayslipTemplateRepository
  extends BaseRepository
  implements IPayslipTemplateRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(filter: { isActive?: boolean }): Promise<PayslipTemplateWithComponents[]> {
    return this.prisma.payslipTemplate.findMany({
      where: filter,
      include: {
        createdBy: { select: { fullName: true } },
        components: {
          include: {
            component: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async findById(id: string): Promise<PayslipTemplateWithComponents | null> {
    return this.prisma.payslipTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { fullName: true } },
        components: {
          include: {
            component: true,
          },
        },
      },
    })
  }

  async create(data: ICreatePayslipTemplateDTO, createdById: string): Promise<PayslipTemplate> {
    return this.prisma.payslipTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        createdById,
        components: {
          create: data.components.map((c) => ({
            componentId: c.componentId,
            overrideFormula: c.overrideFormula,
          })),
        },
      },
    })
  }

  async update(id: string, data: IUpdatePayslipTemplateDTO): Promise<PayslipTemplate> {
    return this.prisma.$transaction(async (tx) => {
      // If components are provided, we replace the entire list
      if (data.components) {
        await tx.payslipTemplateComponent.deleteMany({
          where: { templateId: id },
        })

        await tx.payslipTemplateComponent.createMany({
          data: data.components.map((c) => ({
            templateId: id,
            componentId: c.componentId,
            overrideFormula: c.overrideFormula,
          })),
        })
      }

      return tx.payslipTemplate.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
        },
      })
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.payslipTemplate.update({
      where: { id },
      data: { isActive: false },
    })
  }
}
