import { IPayrollRepository, IUpdatePayrollStatusDTO } from "@/types/payroll.types.ts"

import { Payroll, PayrollStatus, Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaPayrollRepository extends BaseRepository implements IPayrollRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findByPeriod(month: number, year: number): Promise<Payroll | null> {
    return this.prisma.payroll.findUnique({
      where: {
        periodYear_periodMonth: {
          periodMonth: month,
          periodYear: year,
        },
      },
    })
  }

  async findAll(filter: { status?: PayrollStatus; year?: number }): Promise<Payroll[]> {
    const where: Prisma.PayrollWhereInput = {}
    if (filter.status) where.status = filter.status
    if (filter.year) where.periodYear = filter.year

    return this.prisma.payroll.findMany({
      where,
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    })
  }

  async create(data: { periodMonth: number; periodYear: number }): Promise<Payroll> {
    return this.prisma.payroll.create({
      data: {
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        status: "draft",
        totalAmount: 0,
      },
    })
  }

  async updateStatus(id: string, data: IUpdatePayrollStatusDTO): Promise<Payroll> {
    return this.prisma.payroll.update({
      where: { id },
      data: {
        status: data.status,
        approvedById: data.approvedById,
        approvedAt: data.approvedAt,
        rejectReason: data.rejectReason,
      },
    })
  }

  async updateTotalAmount(id: string, totalAmount: Prisma.Decimal): Promise<void> {
    await this.prisma.payroll.update({
      where: { id },
      data: { totalAmount },
    })
  }
}
