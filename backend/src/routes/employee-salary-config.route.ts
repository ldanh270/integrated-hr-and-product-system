import { ROLE } from "@/configs/entities/employee.config.ts"
import { EmployeeSalaryConfigController } from "@/controllers/employee-salary-config.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaEmployeeSalaryConfigRepository } from "@/repositories/employee-salary-config.repository.ts"
import { EmployeeSalaryConfigService } from "@/services/employee-salary-config.service.ts"

import express from "express"

const employeeSalaryConfigRoutes = express.Router()

const repo = new PrismaEmployeeSalaryConfigRepository(prisma)
const service = new EmployeeSalaryConfigService(repo, prisma)
const controller = new EmployeeSalaryConfigController(service)

employeeSalaryConfigRoutes.use(authenticate)
employeeSalaryConfigRoutes.use(authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER))

employeeSalaryConfigRoutes.get("/:id/salary-config", controller.getActiveConfig)
employeeSalaryConfigRoutes.get("/:id/salary-config/history", controller.getConfigHistory)
employeeSalaryConfigRoutes.post("/:id/salary-config", controller.assignConfig)

export default employeeSalaryConfigRoutes
