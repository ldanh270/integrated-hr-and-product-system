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
    return s || { triggerDay: 1, standardWorkingDays: 22 }
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
      res.json({ data: s || { triggerDay: 1, standardWorkingDays: 22 } })
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
      const { triggerDay, standardWorkingDays } = req.body
      const updatedById = (req as any).user?.id
      if (!updatedById) throw new Error("Unauthorized")

      const s = await prisma.payrollSettings.upsert({
        where: { id: "GLOBAL" },
        create: {
          id: "GLOBAL",
          triggerDay: Number(triggerDay),
          standardWorkingDays: Number(standardWorkingDays),
          updatedById,
        },
        update: {
          triggerDay: Number(triggerDay),
          standardWorkingDays: Number(standardWorkingDays),
          updatedById,
        },
      })
      res.json({ data: s })
    } catch (error) {
      next(error)
    }
  },
)

// Custom Salary Fields
payrollRoutes.get(
  "/custom-fields",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER),
  async (req, res, next) => {
    try {
      const fields = await prisma.customSalaryField.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      })
      res.json({ data: fields })
    } catch (error) {
      next(error)
    }
  },
)

payrollRoutes.post(
  "/custom-fields",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER),
  async (req, res, next) => {
    try {
      const { name, code, defaultValue, description } = req.body
      const field = await prisma.customSalaryField.create({
        data: {
          name,
          code,
          defaultValue: Number(defaultValue),
          description,
        },
      })
      res.json({ data: field })
    } catch (error) {
      next(error)
    }
  },
)

payrollRoutes.put(
  "/custom-fields/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER),
  async (req, res, next) => {
    try {
      const id = req.params.id as string
      const { name, code, defaultValue, description, isActive } = req.body
      const field = await prisma.customSalaryField.update({
        where: { id },
        data: {
          name,
          code,
          defaultValue: defaultValue !== undefined ? Number(defaultValue) : undefined,
          description,
          isActive,
        },
      })
      res.json({ data: field })
    } catch (error) {
      next(error)
    }
  },
)

payrollRoutes.delete(
  "/custom-fields/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER),
  async (req, res, next) => {
    try {
      const id = req.params.id as string
      // Soft delete
      const field = await prisma.customSalaryField.update({
        where: { id },
        data: { isActive: false },
      })
      res.json({ data: field })
    } catch (error) {
      next(error)
    }
  },
)

payrollRoutes.get("/", controller.listPayrolls)
payrollRoutes.get("/:id", controller.getPayroll)
payrollRoutes.get("/:id/payslips/:empId", controller.getPayslip)

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
