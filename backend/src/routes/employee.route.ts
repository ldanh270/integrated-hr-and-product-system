import { ROLE } from "@/configs/entities/employee.config.ts"
import { EmployeeController } from "@/controllers/employee.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { validate } from "@/middlewares/validate.middleware.ts"
import { PrismaAuthRepository } from "@/repositories/auth.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { listEmployeesQuerySchema } from "@/schemas/employee.schema.ts"
import { EmployeeService } from "@/services/employee.service.ts"

import express from "express"

const employeeRoutes = express.Router()

const employeeRepository = new PrismaEmployeeRepository(prisma)
const authRepository = new PrismaAuthRepository(prisma)

// Inject both repositories into the EmployeeService
const service = new EmployeeService(employeeRepository, authRepository)

const controller = new EmployeeController(service)

employeeRoutes.use(authenticate)

employeeRoutes.get("/", validate(listEmployeesQuerySchema, "query"), controller.list as express.RequestHandler)
/**
 * GET /employees/approvers
 * Retrieve list of employees who can approve applications (Team Leader, HR Manager, Admin, GM).
 * Accessible to all authenticated users for use in form dropdowns.
 */
employeeRoutes.get("/approvers", controller.listApprovers as express.RequestHandler)

/**
 * GET /employees/:id
 * Retrieve details of a specific employee by ID.
 * Accessible to all authenticated users.
 */
employeeRoutes.get("/:id", controller.getOne as express.RequestHandler)

/**
 * POST /employees
 * Create a new employee.
 * Access restricted to Admin, HR Manager, and General Manager roles.
 */
employeeRoutes.post(
  "/",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.create as express.RequestHandler,
)
employeeRoutes.patch(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.update as express.RequestHandler,
)
employeeRoutes.patch(
  "/:id/status",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.updateStatus as express.RequestHandler,
)
employeeRoutes.delete(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.delete as express.RequestHandler,
)

export default employeeRoutes
