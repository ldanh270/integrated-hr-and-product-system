import { PERMISSION_CODE } from "@/configs/entities/permission.config.ts"
import { RbacManagementController } from "@/controllers/rbac-management.controller.ts"
import { RoleController } from "@/controllers/role.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { validate } from "@/middlewares/validate.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaRoleRepository } from "@/repositories/role.repository.ts"
import { updateRolePermissionsSchema } from "@/schemas/rbac-management.schema.ts"
import { createRoleSchema, listRolesQuerySchema, updateRoleSchema } from "@/schemas/role.schema.ts"
import { EmployeeService } from "@/services/employee.service.ts"
import { RoleService } from "@/services/role.service.ts"

import express from "express"

/**
 * roleRoutes defines the API endpoints for dynamic RBAC AppRole CRUD operations.
 */
const roleRoutes = express.Router()

// Wire dependency injection layers
const repository = new PrismaRoleRepository(prisma)
const service = new RoleService(repository)
const controller = new RoleController(service)

// All endpoints require user authentication
roleRoutes.use(authenticate)

// GET /roles - List paginated roles
roleRoutes.get(
  "/",
  requirePermission("role.read"),
  validate(listRolesQuerySchema, "query"),
  controller.list as express.RequestHandler,
)

// GET /roles/:id - Retrieve single role details
roleRoutes.get("/:id", requirePermission("role.read"), controller.getOne as express.RequestHandler)

// POST /roles - Create new role
roleRoutes.post(
  "/",
  requirePermission("role.create"),
  validate(createRoleSchema, "body"),
  controller.create as express.RequestHandler,
)

// PUT /roles/:id - Update role details
roleRoutes.put(
  "/:id",
  requirePermission("role.update"),
  validate(updateRoleSchema, "body"),
  controller.update as express.RequestHandler,
)

// DELETE /roles/:id - Soft delete role
roleRoutes.delete(
  "/:id",
  requirePermission("role.delete"),
  controller.delete as express.RequestHandler,
)

// Wire RBAC mapping dependencies
const employeeRepository = new PrismaEmployeeRepository(prisma)
const employeeService = new EmployeeService(employeeRepository)
const rbacController = new RbacManagementController(employeeService, service)

// GET /roles/:id/permissions - List permissions assigned to a specific role
roleRoutes.get(
  "/:id/permissions",
  requirePermission(PERMISSION_CODE.ROLE_PERMISSION_READ),
  rbacController.getRolePermissions as express.RequestHandler,
)

// PUT /roles/:id/permissions - Replace permission assignments for a specific role
roleRoutes.put(
  "/:id/permissions",
  requirePermission(PERMISSION_CODE.ROLE_PERMISSION_UPDATE),
  validate(updateRolePermissionsSchema, "body"),
  rbacController.updatePermissions as express.RequestHandler,
)

// POST /roles/:id/permissions/:permissionId - Assign one permission to a specific role
roleRoutes.post(
  "/:id/permissions/:permissionId",
  requirePermission(PERMISSION_CODE.ROLE_PERMISSION_UPDATE),
  rbacController.assignPermission as express.RequestHandler,
)

// DELETE /roles/:id/permissions/:permissionId - Revoke one permission from a specific role
roleRoutes.delete(
  "/:id/permissions/:permissionId",
  requirePermission(PERMISSION_CODE.ROLE_PERMISSION_UPDATE),
  rbacController.revokePermission as express.RequestHandler,
)

export default roleRoutes
