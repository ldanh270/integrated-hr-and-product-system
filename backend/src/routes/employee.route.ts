import { ROLE } from "@/configs/entities/employee.config.ts"
import { EmployeeController } from "@/controllers/employee.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaAuthRepository } from "@/repositories/auth.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { EmployeeService } from "@/services/employee.service.ts"

import express from "express"

const employeeRoutes = express.Router()

const employeeRepository = new PrismaEmployeeRepository(prisma)
const authRepository = new PrismaAuthRepository(prisma)

// Inject both repositories into the EmployeeService
const service = new EmployeeService(employeeRepository, authRepository)

const controller = new EmployeeController(service)

employeeRoutes.use(authenticate)

employeeRoutes.get("/", controller.list as any)
employeeRoutes.get("/:id", controller.getOne as any)

employeeRoutes.post(
  "/",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.create as any,
)
employeeRoutes.patch(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.update as any,
)
employeeRoutes.patch(
  "/:id/status",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.updateStatus as any,
)
employeeRoutes.delete(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.delete as any,
)

export default employeeRoutes
