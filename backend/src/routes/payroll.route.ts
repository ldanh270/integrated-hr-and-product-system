import { ROLE } from "@/configs/entities/employee.config.ts"
import { PayrollController } from "@/controllers/payroll.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaAttendanceRepository } from "@/repositories/attendance.repository.ts"
import { PrismaEmployeeSalaryConfigRepository } from "@/repositories/employee-salary-config.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaPayrollRepository } from "@/repositories/payroll.repository.ts"
import { PrismaPayslipRepository } from "@/repositories/payslip.repository.ts"
import { PayrollService } from "@/services/payroll.service.ts"

import express from "express"

const payrollRoutes = express.Router()

const payrollRepo = new PrismaPayrollRepository(prisma)
const payslipRepo = new PrismaPayslipRepository(prisma)
const configRepo = new PrismaEmployeeSalaryConfigRepository(prisma)
const attendanceRepo = new PrismaAttendanceRepository(prisma)
const employeeRepo = new PrismaEmployeeRepository(prisma)
const settingsRepo = {
  findGlobal: async () => {
    const s = await prisma.payrollSettings.findUnique({ where: { id: "GLOBAL" } })
    return s || { triggerDay: 1, triggerHour: 0, triggerMinute: 0 }
  },
}

const service = new PayrollService(
  payrollRepo,
  payslipRepo,
  configRepo,
  attendanceRepo,
  employeeRepo,
  settingsRepo,
  prisma,
)
const controller = new PayrollController(service)

payrollRoutes.use(authenticate)

// Self / Employee routes
payrollRoutes.get("/my/payslips", controller.getMyPayslips)

// HR / GM / Admin routes
payrollRoutes.use(authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER))

// Payroll Settings
payrollRoutes.get(
  "/settings",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER),
  async (req, res, next) => {
    try {
      const s = await prisma.payrollSettings.findUnique({ where: { id: "GLOBAL" } })
      res.json({ data: s || { triggerDay: 1, triggerHour: 0, triggerMinute: 0 } })
    } catch (error) {
      next(error)
    }
  },
)

payrollRoutes.put(
  "/settings",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER),
  async (req, res, next) => {
    try {
      const { triggerDay, triggerHour, triggerMinute } = req.body
      const updatedById = (req as any).user?.empId
      if (!updatedById) throw new Error("Unauthorized")

      const s = await prisma.payrollSettings.upsert({
        where: { id: "GLOBAL" },
        create: {
          id: "GLOBAL",
          triggerDay: Number(triggerDay),
          triggerHour: triggerHour !== undefined ? Number(triggerHour) : 0,
          triggerMinute: triggerMinute !== undefined ? Number(triggerMinute) : 0,
          updatedById,
        },
        update: {
          triggerDay: Number(triggerDay),
          triggerHour: triggerHour !== undefined ? Number(triggerHour) : undefined,
          triggerMinute: triggerMinute !== undefined ? Number(triggerMinute) : undefined,
          updatedById,
        },
      })
      res.json({ data: s })
    } catch (error) {
      next(error)
    }
  },
)

payrollRoutes.get("/", controller.listPayrolls)
payrollRoutes.get("/:id", controller.getPayroll)
payrollRoutes.get("/:id/payslips/:empId", controller.getPayslip)
payrollRoutes.get(
  "/employee/:empId/payslips",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER),
  controller.getEmployeePayslips,
)

// Modifying routes for HR / Admin
payrollRoutes.post(
  "/generate",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER),
  controller.generatePayroll,
)

// Modifying routes for GM
payrollRoutes.post(
  "/:id/approve",
  authorizeRoles(ROLE.ADMIN, ROLE.GENERAL_MANAGER),
  controller.approvePayroll,
)
payrollRoutes.post(
  "/:id/reject",
  authorizeRoles(ROLE.ADMIN, ROLE.GENERAL_MANAGER),
  controller.rejectPayroll,
)

export default payrollRoutes
