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
    return s || { triggerDay: 1, standardWorkingDays: 22 }
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
  // Run at 00:00 every day
  cron.schedule("0 0 * * *", async () => {
    try {
      const settings = await settingsRepo.findGlobal()
      const today = new Date()

      if (today.getDate() !== settings.triggerDay) return

      const month = today.getMonth() + 1
      const year = today.getFullYear()

      const existing = await payrollRepo.findByPeriod(month, year)
      if (existing) return // Already ran for this month

      console.log(`[CRON] Generating Payroll for ${month}/${year}...`)
      await payrollService.generatePayroll(month, year)
      console.log(`[CRON] Payroll ${month}/${year} generated successfully.`)
    } catch (error) {
      console.error("[CRON] Error generating payroll:", error)
    }
  })

  console.log("[CRON] Payroll auto-trigger job scheduled.")
}
