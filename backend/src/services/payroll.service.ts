import { ATTENDANCE_STATUS, EMPLOYEE_SHIFT_STATUS } from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { PAYROLL_STATUS, SALARY_COMPONENT_TYPES } from "@/configs/entities/payroll.config.ts"
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

import { Payroll, PayrollStatus, Prisma, PrismaClient } from "@prisma/client"
import * as math from "mathjs"

// Need an interface for SettingsRepository
interface IPayrollSettingsRepository {
  findGlobal(): Promise<{ triggerDay: number }>
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
      throw new AppError(
        "Payroll already exists for this period",
        HttpStatusCode.CONFLICT,
        "SERVICE",
      )
    }

    const settings = await this.settingsRepo.findGlobal()
    const employeeData = await this.employeeRepo.listEmployeesPaginated({
      status: EMPLOYEE_STATUS.ACTIVE,
      limit: 100000,
    })
    const employees = employeeData.data

    // Date range of the month
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0) // last day of the month

    const payroll = await this.payrollRepo.create({ periodMonth: month, periodYear: year })

    // Fetch all active global salary variables
    const globalVariables = await this.prisma.salaryVariable.findMany({
      where: { isActive: true },
    })
    const variablesContext: Record<string, number> = {}
    globalVariables.forEach((v: any) => {
      variablesContext[v.code] = Number(v.value)
    })
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
        earlyLeaveMinutes: 0,
        holidayDays: 0,
      }
      attendanceRecords.forEach((record) => {
        if (record.status === ATTENDANCE_STATUS.ON_TIME || record.status === ATTENDANCE_STATUS.LATE)
          attendance.workingDays += 1
        if (record.status === ATTENDANCE_STATUS.ABSENT) attendance.absentDays += 1
        if (record.status === ATTENDANCE_STATUS.OVERTIME) attendance.workingDays += 1 // or separate counting
        if (record.status === (EMPLOYEE_SHIFT_STATUS.HOLIDAY_PENDING as string))
          attendance.holidayDays += 1 // adjust based on actual logic

        attendance.overtimeMinutes += record.overtimeMinutes || 0
        attendance.lateMinutes += record.lateMinutes || 0
      })

      // Build context
      const context: IFormulaContext | any = {
        baseSalary: Number(config.baseSalary),
        workingDays: attendance.workingDays,
        absentDays: attendance.absentDays,
        overtimeMinutes: attendance.overtimeMinutes,
        lateMinutes: attendance.lateMinutes,
        earlyLeaveMinutes: attendance.earlyLeaveMinutes,
        holidayDays: attendance.holidayDays,
        MAX: Math.max,
        MIN: Math.min,
        ...variablesContext,
      }

      const details = []
      let totalAdditions = new Prisma.Decimal(0)
      let totalDeductions = new Prisma.Decimal(0)

      const components = config.template.components
      for (const tc of components) {
        context.totalAdditions = Number(totalAdditions)
        context.totalDeductions = Number(totalDeductions)

        const formula = tc.overrideFormula ?? tc.component.formula
        let rawValue = 0
        try {
          rawValue = math.evaluate(formula, context)
        } catch (err) {
          console.error("Error evaluating formula:", formula, "Context:", context)
          throw err
        }
        const value = new Prisma.Decimal(Math.max(0, rawValue))

        details.push({
          componentId: tc.component.id,
          name: tc.component.name,
          type: tc.component.type,
          value: Number(value.toFixed(2)),
        })

        if (tc.component.type === SALARY_COMPONENT_TYPES[0]) {
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

  async getPayrollById(id: string): Promise<any> {
    const payroll = await this.payrollRepo.findById(id)
    if (!payroll) throw new AppError("Payroll not found", HttpStatusCode.NOT_FOUND, "SERVICE")

    const payslips = await this.payslipRepo.findByPayroll(id)

    return {
      ...payroll,
      payslips,
    }
  }

  async listPayrolls(filter: { status?: PayrollStatus; year?: number }): Promise<Payroll[]> {
    return this.payrollRepo.findAll(filter)
  }

  async approvePayroll(payrollId: string, approverId: string): Promise<Payroll> {
    return this.payrollRepo.updateStatus(payrollId, {
      status: PAYROLL_STATUS.APPROVED,
      approvedById: approverId,
      approvedAt: new Date(),
    })
  }

  async rejectPayroll(payrollId: string, approverId: string, reason: string): Promise<Payroll> {
    return this.payrollRepo.updateStatus(payrollId, {
      status: PAYROLL_STATUS.REJECTED,
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
    const rawPayslips = await this.payslipRepo.findByEmployee(employeeId)
    // Map included payroll info to the top level for the frontend
    return rawPayslips.map((p: any) => ({
      ...p,
      periodMonth: p.payroll?.periodMonth,
      periodYear: p.payroll?.periodYear,
      status: p.payroll?.status,
    }))
  }
}
