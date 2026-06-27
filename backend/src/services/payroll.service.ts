import { ATTENDANCE_STATUS, EMPLOYEE_SHIFT_STATUS, PAID_LEAVE_TYPES } from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS, EMPLOYEE_TYPE } from "@/configs/entities/employee.config.ts"
import { SPENT_TIME_WORK_TIME_TYPE } from "@/configs/entities/project.config.ts"
import {
  PAYROLL_STATUS,
  SALARY_COMPONENT_TYPES,
  generateDefaultPayrollName,
} from "@/configs/entities/payroll.config.ts"
import { SPENT_TIME_OT_MULTIPLIERS } from "@/configs/rules/project.config.ts"
import { PAYROLL_MESSAGES } from "@/configs/messages/payroll.message"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
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
import { ISpentTimeRepository } from "@/types/spent-time.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { Application, ApplicationType, ComponentType, Payroll, PayrollStatus, Prisma, PrismaClient } from "@prisma/client"
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
    private spentTimeRepo: ISpentTimeRepository,
    private settingsRepo: IPayrollSettingsRepository,
    private prisma: PrismaClient,
  ) {}

  /**
   * Initialize a new payroll for a specific month and year.
   *
   * @param month - The month parameter
   * @param year - The year parameter
   * @param name - The name parameter (optional)
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async generatePayroll(month: number, year: number, name?: string): Promise<Payroll> {
    const finalName = name || generateDefaultPayrollName(month, year)
    const existing = await this.payrollRepo.findByPeriod(month, year, finalName)
    if (existing) {
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYROLL_ALREADY_EXISTS,
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
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

    const payroll = await this.payrollRepo.create({
      periodMonth: month,
      periodYear: year,
      name: finalName,
    })

    // Fetch all active global salary variables
    const globalVariables = await this.prisma.salaryVariable.findMany({
      where: { isActive: true },
    })
    const variablesContext: Record<string, number> = {}
    globalVariables.forEach((v: any) => {
      variablesContext[v.code] = Number(v.value)
    })
    let totalAmount = new Prisma.Decimal(0)

    // Fetch all approved applications for the period ONCE (N+1 fix)
    const allApprovedApps = await this.prisma.application.findMany({
      where: {
        employeeId: { in: employees.map(e => e.id) },
        status: "approved",
        type: { in: [ApplicationType.leave, ApplicationType.late_early] },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      include: { leaveDetail: true, lateEarlyDetail: true }
    });

    // Group by employeeId in memory
    const appsByEmployeeId: Record<string, Prisma.ApplicationGetPayload<{ include: { leaveDetail: true, lateEarlyDetail: true } }>[] | undefined> = {};
    allApprovedApps.forEach(app => {
      if (!appsByEmployeeId[app.employeeId]) appsByEmployeeId[app.employeeId] = [];
      const employeeApps = appsByEmployeeId[app.employeeId];
      if (employeeApps) {
        employeeApps.push(app);
      }
    });

    for (const employee of employees) {
      const config = await this.salaryConfigRepo.findActiveByEmployee(employee.id, periodStart)
      if (!config) {
        console.warn(`[PayrollService] No active config for employee ${employee.id}`)
        continue
      }

      // PT payroll branch: skip attendance workingDays — salary from approved SpentTime only.
      if (employee.employeeType === EMPLOYEE_TYPE.PART_TIME) {
        const ptResult = await this.buildPartTimePayslip(
          payroll.id,
          employee.id,
          config.id,
          periodStart,
          periodEnd,
        )
        if (ptResult) {
          totalAmount = totalAmount.add(ptResult.netSalary)
        }
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
        if (record.status === ATTENDANCE_STATUS.OVERTIME) attendance.workingDays += 1
        if (record.status === (EMPLOYEE_SHIFT_STATUS.HOLIDAY_PENDING as string))
          attendance.holidayDays += 1

        attendance.overtimeMinutes += record.overtimeMinutes || 0
        attendance.lateMinutes += record.lateMinutes || 0
        attendance.earlyLeaveMinutes += record.earlyLeaveMinutes || 0
      })

      // Use pre-fetched applications to prevent N+1
      const approvedApps = appsByEmployeeId[employee.id] || [];

      let paidLeaveDays = 0
      let excusedLateMinutes = 0
      let excusedEarlyMinutes = 0

      for (const app of approvedApps) {
        if (app.type === "leave" && app.leaveDetail) {
          if ((PAID_LEAVE_TYPES as string[]).includes(app.leaveDetail.leaveType)) {
            const start = app.startDate > periodStart ? app.startDate : periodStart
            const end = app.endDate < periodEnd ? app.endDate : periodEnd
            let days = 0;
            let current = new Date(start);
            while (current <= end) {
              const day = current.getDay();
              if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
                days++;
              }
              current.setDate(current.getDate() + 1);
            }
            paidLeaveDays += Math.max(1, days);
          }
        } else if (app.type === "late_early" && app.lateEarlyDetail) {
          if (app.lateEarlyDetail.isLate) {
            excusedLateMinutes += app.lateEarlyDetail.durationMinutes
          } else {
            excusedEarlyMinutes += app.lateEarlyDetail.durationMinutes
          }
        }
      }

      attendance.workingDays += paidLeaveDays
      attendance.lateMinutes = Math.max(0, attendance.lateMinutes - excusedLateMinutes)
      attendance.earlyLeaveMinutes = Math.max(0, attendance.earlyLeaveMinutes - excusedEarlyMinutes)

      // Build context
      const context: IFormulaContext | any = {
        baseSalary: Number(config.baseSalary),
        workingDays: 22, // Should ideally be standard working days for the month. Currently hardcoded to 22 or fetched from config
        actualWorkingDays: attendance.workingDays,
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

  /** Builds payslip from approved SpentTime rows; skips employees with no approved hours in period. */
  private async buildPartTimePayslip(
    payrollId: string,
    employeeId: string,
    salaryConfigId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{ netSalary: Prisma.Decimal } | null> {
    const rows = await this.spentTimeRepo.listApprovedForPayroll(employeeId, periodStart, periodEnd)
    if (rows.length === 0) {
      console.warn(`[PayrollService] No approved spent time for PT employee ${employeeId}`)
      return null
    }

    let totalHours = 0
    let grossPay = 0
    const details: { componentId: string; name: string; type: ComponentType; value: number }[] = []

    for (const row of rows) {
      const multiplier =
        SPENT_TIME_OT_MULTIPLIERS[row.workTimeType] ??
        SPENT_TIME_OT_MULTIPLIERS[SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY]
      // gross = hours × project member rate × OT factor (see SPENT_TIME_RULES).
      const linePay = row.hours * row.hourlyRate * multiplier
      totalHours += row.hours
      grossPay += linePay
      details.push({
        componentId: row.id,
        name: `Dự án ${row.projectId}`,
        type: SALARY_COMPONENT_TYPES[0] as ComponentType,
        value: Number(linePay.toFixed(2)),
      })
    }

    const netSalary = new Prisma.Decimal(Number(grossPay.toFixed(2)))

    await this.payslipRepo.createWithDetails({
      payrollId,
      employeeId,
      salaryConfigId,
      totalAdditions: Number(grossPay.toFixed(2)),
      totalDeductions: 0,
      netSalary: Number(grossPay.toFixed(2)),
      workingDays: 0,
      absentDays: 0,
      overtimeMinutes: Math.round(
        rows
          .filter((r) => r.workTimeType === SPENT_TIME_WORK_TIME_TYPE.OVERTIME)
          .reduce((sum, r) => sum + r.hours * 60, 0),
      ),
      details,
    })

    return { netSalary }
  }

  /**
   * Process business logic for getPayroll.
   *
   * @param month - The month parameter
   * @param year - The year parameter
   * @param name - The name parameter (optional)
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async getPayroll(month: number, year: number, name?: string): Promise<Payroll> {
    const finalName = name || generateDefaultPayrollName(month, year)
    const payroll = await this.payrollRepo.findByPeriod(month, year, finalName)
    if (!payroll)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYROLL_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    return payroll
  }

  /**
   * Process business logic for getPayrollById.
   *
   * @param id - The id parameter
   * @returns Returns the result of type Promise<any>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async getPayrollById(id: string): Promise<any> {
    const payroll = await this.payrollRepo.findById(id)
    if (!payroll)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYROLL_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )

    const payslips = await this.payslipRepo.findByPayroll(id)

    return {
      ...payroll,
      payslips,
    }
  }

  /**
   * Process business logic for listPayrolls.
   *
   * @param filter - The filter parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }[]>
   */
  async listPayrolls(filter: { status?: PayrollStatus; year?: number }): Promise<Payroll[]> {
    return this.payrollRepo.findAll(filter)
  }

  /**
   * Approve a payroll, changing its status to approved.
   *
   * @param payrollId - The payrollId parameter
   * @param approverId - The approverId parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }>
   */
  async approvePayroll(payrollId: string, approverId: string): Promise<Payroll> {
    return this.payrollRepo.updateStatus(payrollId, {
      status: PAYROLL_STATUS.APPROVED,
      approvedById: approverId,
      approvedAt: new Date(),
    })
  }

  /**
   * Reject a payroll and record the rejection reason.
   *
   * @param payrollId - The payrollId parameter
   * @param approverId - The approverId parameter
   * @param reason - The reason parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }>
   */
  async rejectPayroll(payrollId: string, approverId: string, reason: string): Promise<Payroll> {
    return this.payrollRepo.updateStatus(payrollId, {
      status: PAYROLL_STATUS.REJECTED,
      approvedById: approverId,
      approvedAt: new Date(),
      rejectReason: reason,
    })
  }

  /**
   * Handle the request to retrieve detailed payslip information for an employee.
   *
   * @param payrollId - The payrollId parameter
   * @param employeeId - The employeeId parameter
   * @returns Returns the result of type Promise<PayslipWithDetails>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async getPayslip(payrollId: string, employeeId: string): Promise<PayslipWithDetails> {
    const payslip = await this.payslipRepo.findOne(payrollId, employeeId)
    if (!payslip)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYSLIP_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    return payslip
  }

  /**
   * Process business logic for getMyPayslips.
   *
   * @param employeeId - The employeeId parameter
   * @returns Returns the result of type Promise<any[]>
   */
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
