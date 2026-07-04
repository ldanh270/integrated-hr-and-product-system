import { PERMISSION_CODE } from "@/configs/entities/permission.config.ts"
import { EmployeeController } from "@/controllers/employee.controller.ts"
import { RbacManagementController } from "@/controllers/rbac-management.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { validate } from "@/middlewares/validate.middleware.ts"
import { PrismaAuthRepository } from "@/repositories/auth.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaRoleRepository } from "@/repositories/role.repository.ts"
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from "@/schemas/employee.schema.ts"
import { updateEmployeeRolesSchema } from "@/schemas/rbac-management.schema.ts"
import { EmployeeService } from "@/services/employee.service.ts"
import { RoleService } from "@/services/role.service.ts"

import express from "express"

const employeeRoutes = express.Router()

const employeeRepository = new PrismaEmployeeRepository(prisma)
const authRepository = new PrismaAuthRepository(prisma)

// Inject both repositories into the EmployeeService
const service = new EmployeeService(employeeRepository, authRepository)

const controller = new EmployeeController(service)

employeeRoutes.use(authenticate)

employeeRoutes.get(
  "/",
  requirePermission("employee.read"),
  validate(listEmployeesQuerySchema, "query"),
  controller.list as express.RequestHandler,
)
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
employeeRoutes.get(
  "/:id",
  requirePermission("employee.read"),
  controller.getOne as express.RequestHandler,
)

/**
 * POST /employees
 * Create a new employee.
 * Access restricted to employee.create permission.
 */
employeeRoutes.post(
  "/",
  requirePermission("employee.create"),
  validate(createEmployeeSchema, "body"),
  controller.create as express.RequestHandler,
)

/**
 * PATCH /employees/:id
 * Update employee profile.
 * Access restricted to employee.update permission.
 */
employeeRoutes.patch(
  "/:id",
  requirePermission("employee.update"),
  validate(updateEmployeeSchema, "body"),
  controller.update as express.RequestHandler,
)

/**
 * PATCH /employees/:id/status
 * Update employee status.
 * Access restricted to employee.update permission.
 */
employeeRoutes.patch(
  "/:id/status",
  requirePermission("employee.update"),
  validate(updateEmployeeStatusSchema, "body"),
  controller.updateStatus as express.RequestHandler,
)

/**
 * DELETE /employees/:id
 * Soft delete employee.
 * Access restricted to employee.delete permission.
 */
employeeRoutes.delete(
  "/:id",
  requirePermission("employee.delete"),
  controller.delete as express.RequestHandler,
)

const roleRepository = new PrismaRoleRepository(prisma)
const roleService = new RoleService(roleRepository)
const rbacController = new RbacManagementController(service, roleService)

employeeRoutes.get(
  "/:id/roles",
  requirePermission(PERMISSION_CODE.EMPLOYEE_ROLE_READ),
  rbacController.getEmployeeRoles as express.RequestHandler,
)

employeeRoutes.put(
  "/:id/roles",
  requirePermission(PERMISSION_CODE.EMPLOYEE_ROLE_UPDATE),
  validate(updateEmployeeRolesSchema, "body"),
  rbacController.updateRoles as express.RequestHandler,
)

employeeRoutes.post(
  "/:id/roles/:roleId",
  requirePermission(PERMISSION_CODE.EMPLOYEE_ROLE_UPDATE),
  rbacController.assignRole as express.RequestHandler,
)

employeeRoutes.delete(
  "/:id/roles/:roleId",
  requirePermission(PERMISSION_CODE.EMPLOYEE_ROLE_UPDATE),
  rbacController.revokeRole as express.RequestHandler,
)

export default employeeRoutes
