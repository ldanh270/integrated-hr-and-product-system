import { ROLE } from "@/configs/entities/employee.config.ts"
import { EmployeeController } from "@/controllers/employee.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { validate } from "@/middlewares/validate.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from "@/schemas/employee.schema.ts"
import { EmployeeService } from "@/services/employee.service.ts"

import express from "express"

/**
 * Express router defining routing routes and applying validation/authorization middlewares
 * for Employee management operations.
 */
const employeeRoutes = express.Router()

// Wire dependencies (Constructor Injection)
const repository = new PrismaEmployeeRepository(prisma)
const service = new EmployeeService(repository)
const controller = new EmployeeController(service)

// Apply JWT authentication guard globally for all employee endpoints
employeeRoutes.use(authenticate)

/**
 * GET /employees
 * Retrieve list of employees. Paginated and filtered.
 * Accessible to all authenticated users.
 */
employeeRoutes.get("/", validate(listEmployeesQuerySchema, "query"), controller.list)

/**
 * GET /employees/:id
 * Retrieve details of a specific employee by ID.
 * Accessible to all authenticated users.
 */
employeeRoutes.get("/:id", controller.getOne)

/**
 * POST /employees
 * Create a new employee.
 * Access restricted to Admin, HR Manager, and General Manager roles.
 */
employeeRoutes.post(
  "/",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  validate(createEmployeeSchema),
  controller.create,
)

/**
 * PATCH /employees/:id
 * Update details of an existing employee.
 * Access restricted to Admin, HR Manager, and General Manager roles.
 */
employeeRoutes.patch(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  validate(updateEmployeeSchema),
  controller.update,
)

/**
 * PATCH /employees/:id/status
 * Update the employment status of an employee.
 * Access restricted to Admin, HR Manager, and General Manager roles.
 */
employeeRoutes.patch(
  "/:id/status",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  validate(updateEmployeeStatusSchema),
  controller.updateStatus,
)

/**
 * DELETE /employees/:id
 * Soft delete an employee record.
 * Access restricted to Admin, HR Manager, and General Manager roles.
 */
employeeRoutes.delete(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.delete,
)

export default employeeRoutes
