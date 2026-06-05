import { ICreatePayslipDTO, IPayslipRepository, PayslipWithDetails } from "@/types/payroll.types.ts"

import { Payslip, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaPayslipRepository extends BaseRepository implements IPayslipRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findByPayroll(payrollId: string): Promise<PayslipWithDetails[]> {
    return this.prisma.payslip.findMany({
      where: { payrollId },
      include: {
        details: true,
      },
    })
  }

  async findByEmployee(employeeId: string): Promise<Payslip[]> {
    return this.prisma.payslip.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    })
  }

  async findOne(payrollId: string, employeeId: string): Promise<PayslipWithDetails | null> {
    return this.prisma.payslip.findUnique({
      where: {
        payrollId_employeeId: {
          payrollId,
          employeeId,
        },
      },
      include: {
        details: true,
      },
    })
  }

  async createWithDetails(data: ICreatePayslipDTO): Promise<Payslip> {
    return this.prisma.payslip.create({
      data: {
        payrollId: data.payrollId,
        employeeId: data.employeeId,
        salaryConfigId: data.salaryConfigId,
        totalAdditions: data.totalAdditions,
        totalDeductions: data.totalDeductions,
        netSalary: data.netSalary,
        workingDays: data.workingDays,
        absentDays: data.absentDays,
        overtimeMinutes: data.overtimeMinutes,
        details: {
          create: data.details.map((d) => ({
            componentId: d.componentId,
            name: d.name,
            type: d.type,
            value: d.value,
          })),
        },
      },
    })
  }
}
