import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IAttendanceRepository } from "@/types/attendance.types.ts"
import { IEmployeeRepository } from "@/types/employee.types.ts"
import {
  IEmployeeSalaryConfigRepository,
  IFormulaContext,
  IPayrollRepository,
  IPayrollService,
  IPayslipRepository,
  PayslipWithDetails,
} from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { Payroll, PayrollStatus, PrismaClient, Prisma } from "@prisma/client"
import * as math from "mathjs"

// Need an interface for SettingsRepository
interface IPayrollSettingsRepository {
  findGlobal(): Promise<{ standardWorkingDays: number; triggerDay: number }>
}

export class PayrollService implements IPayrollService {
  constructor(
    private payrollRepo: IPayrollRepository,
    private payslipRepo: IPayslipRepository,
    private salaryConfigRepo: IEmployeeSalaryConfigRepository,
    private attendanceRepo: IAttendanceRepository,
    private employeeRepo: IEmployeeRepository,
    private settingsRepo: IPayrollSettingsRepository,
    private prisma: PrismaClient,
  ) {}

  async generatePayroll(month: number, year: number): Promise<Payroll> {
    const existing = await this.payrollRepo.findByPeriod(month, year)
    if (existing) {
      throw new AppError("Payroll already exists for this period", HttpStatusCode.CONFLICT, "SERVICE")
    }

    const settings = await this.settingsRepo.findGlobal()
    const employeeData = await this.employeeRepo.listEmployeesPaginated({
      status: "active",
      limit: 100000,
    })
    const employees = employeeData.data

    // Date range of the month
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0) // last day of the month

    const payroll = await this.payrollRepo.create({ periodMonth: month, periodYear: year })

    let totalAmount = new Prisma.Decimal(0)

    for (const employee of employees) {
      const config = await this.salaryConfigRepo.findActiveByEmployee(employee.id, periodStart)
      if (!config) {
        console.warn(`[PayrollService] No active config for employee ${employee.id}`)
        continue
      }

      // Aggregate attendance
      // Assuming attendanceRepo.queryRecords supports date range filtering
      const attendanceRecords = await this.attendanceRepo.queryRecords({
        employeeId: employee.id,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      })

      // Calculate summary
      const attendance = {
        workingDays: 0,
        absentDays: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        holidayDays: 0,
      }
      attendanceRecords.forEach((record) => {
        if (record.status === "on_time" || record.status === "late") attendance.workingDays += 1
        if (record.status === "absent") attendance.absentDays += 1
        if (record.status === "overtime") attendance.workingDays += 1 // or separate counting
        if (record.status === "holiday_pending") attendance.holidayDays += 1 // adjust based on actual logic

        attendance.overtimeMinutes += record.overtimeMinutes || 0
        attendance.lateMinutes += record.lateMinutes || 0
      })

      // Build context
      const context: IFormulaContext = {
        baseSalary: Number(config.baseSalary),
        mealAllowance: Number(config.mealAllowance ?? 0),
        transportAllowance: Number(config.transportAllowance ?? 0),
        housingAllowance: Number(config.housingAllowance ?? 0),
        phoneAllowance: Number(config.phoneAllowance ?? 0),
        responsibilityAllowance: Number(config.responsibilityAllowance ?? 0),
        seniorityAllowance: Number(config.seniorityAllowance ?? 0),
        standardDays: settings.standardWorkingDays,
        workingDays: attendance.workingDays,
        absentDays: attendance.absentDays,
        overtimeMinutes: attendance.overtimeMinutes,
        lateMinutes: attendance.lateMinutes,
        holidayDays: attendance.holidayDays,
      }

      const details = []
      let totalAdditions = new Prisma.Decimal(0)
      let totalDeductions = new Prisma.Decimal(0)

      const components = config.template.components
      for (const tc of components) {
        const formula = tc.overrideFormula ?? tc.component.formula
        const rawValue = math.evaluate(formula, context)
        const value = new Prisma.Decimal(Math.max(0, rawValue))

        details.push({
          componentId: tc.component.id,
          name: tc.component.name,
          type: tc.component.type,
          value: Number(value.toFixed(2)),
        })

        if (tc.component.type === "addition") {
          totalAdditions = totalAdditions.add(value)
        } else {
          totalDeductions = totalDeductions.add(value)
        }
      }

      const netSalary = totalAdditions.minus(totalDeductions)
      totalAmount = totalAmount.add(netSalary)

      await this.payslipRepo.createWithDetails({
        payrollId: payroll.id,
        employeeId: employee.id,
        salaryConfigId: config.id,
        totalAdditions: Number(totalAdditions.toFixed(2)),
        totalDeductions: Number(totalDeductions.toFixed(2)),
        netSalary: Number(netSalary.toFixed(2)),
        workingDays: attendance.workingDays,
        absentDays: attendance.absentDays,
        overtimeMinutes: attendance.overtimeMinutes,
        details,
      })
    }

    await this.payrollRepo.updateTotalAmount(payroll.id, totalAmount)
    return { ...payroll, totalAmount }
  }

  async getPayroll(month: number, year: number): Promise<Payroll> {
    const payroll = await this.payrollRepo.findByPeriod(month, year)
    if (!payroll) throw new AppError("Payroll not found", HttpStatusCode.NOT_FOUND, "SERVICE")
    return payroll
  }

  async listPayrolls(filter: { status?: PayrollStatus; year?: number }): Promise<Payroll[]> {
    return this.payrollRepo.findAll(filter)
  }

  async approvePayroll(payrollId: string, approverId: string): Promise<Payroll> {
    return this.payrollRepo.updateStatus(payrollId, {
      status: "approved",
      approvedById: approverId,
      approvedAt: new Date(),
    })
  }

  async rejectPayroll(payrollId: string, approverId: string, reason: string): Promise<Payroll> {
    return this.payrollRepo.updateStatus(payrollId, {
      status: "rejected",
      approvedById: approverId,
      approvedAt: new Date(),
      rejectReason: reason,
    })
  }

  async getPayslip(payrollId: string, employeeId: string): Promise<PayslipWithDetails> {
    const payslip = await this.payslipRepo.findOne(payrollId, employeeId)
    if (!payslip) throw new AppError("Payslip not found", HttpStatusCode.NOT_FOUND, "SERVICE")
    return payslip
  }

  async getMyPayslips(employeeId: string): Promise<any[]> {
    return this.payslipRepo.findByEmployee(employeeId)
  }
}
