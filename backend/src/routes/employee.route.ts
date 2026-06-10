import { ROLE } from "@/configs/entities/employee.config.ts"
import { EmployeeController } from "@/controllers/employee.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { EmployeeService } from "@/services/employee.service.ts"

import express from "express"

const employeeRoutes = express.Router()

const repository = new PrismaEmployeeRepository(prisma)
const service = new EmployeeService(repository)
const controller = new EmployeeController(service)

employeeRoutes.use(authenticate)

employeeRoutes.get("/", controller.list)
employeeRoutes.get("/:id", controller.getOne)

employeeRoutes.post(
  "/",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.create,
)
employeeRoutes.patch(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.update,
)
employeeRoutes.patch(
  "/:id/status",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.updateStatus,
)
employeeRoutes.delete(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.delete,
)

export default employeeRoutes
