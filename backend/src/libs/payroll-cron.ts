import { prisma } from "@/libs/database.ts"
import { PrismaAttendanceRepository } from "@/repositories/attendance.repository.ts"
import { PrismaEmployeeSalaryConfigRepository } from "@/repositories/employee-salary-config.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaPayrollRepository } from "@/repositories/payroll.repository.ts"
import { PrismaPayslipRepository } from "@/repositories/payslip.repository.ts"
import { PayrollService } from "@/services/payroll.service.ts"

import cron from "node-cron"

const payrollRepo = new PrismaPayrollRepository(prisma)
const payslipRepo = new PrismaPayslipRepository(prisma)
const configRepo = new PrismaEmployeeSalaryConfigRepository(prisma)
const attendanceRepo = new PrismaAttendanceRepository(prisma)
const employeeRepo = new PrismaEmployeeRepository(prisma)
const settingsRepo = {
  findGlobal: async () => {
    const s = await prisma.payrollSettings.findUnique({ where: { id: "GLOBAL" } })
    return s || { triggerDay: 1, triggerHour: 0, triggerMinute: 0, standardWorkingDays: 22 }
  },
}

const payrollService = new PayrollService(
  payrollRepo,
  payslipRepo,
  configRepo,
  attendanceRepo,
  employeeRepo,
  settingsRepo,
  prisma,
)

export const initCronJobs = () => {
  // Run every minute to check if current time matches trigger settings
  cron.schedule("* * * * *", async () => {
    try {
      const settings = await settingsRepo.findGlobal()
      const today = new Date()

      // Check day, hour, and minute
      if (
        today.getDate() !== settings.triggerDay ||
        today.getHours() !== settings.triggerHour ||
        today.getMinutes() !== settings.triggerMinute
      ) {
        return
      }

      const month = today.getMonth() + 1
      const year = today.getFullYear()

      // We check if a default payroll exists for this period, or just any payroll?
      // Since it's the cron job, it generates the main default payroll.
      const existing = await payrollRepo.findByPeriod(month, year) // Need to ensure findByPeriod is ok
      if (existing) return // Already ran for this month

      console.log(`[CRON] Generating Payroll for ${month}/${year}...`)
      // Cron job uses the default name generated in the service
      await payrollService.generatePayroll(month, year)
      console.log(`[CRON] Payroll ${month}/${year} generated successfully.`)
    } catch (error) {
      console.error("[CRON] Error generating payroll:", error)
    }
  })

  console.log("[CRON] Payroll auto-trigger job scheduled.")
}
