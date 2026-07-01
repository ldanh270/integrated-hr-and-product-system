import { PERMISSION_CODE } from "@/configs/entities/permission.config.ts"
import { PermissionController } from "@/controllers/permission.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { validate } from "@/middlewares/validate.middleware.ts"
import { PrismaPermissionRepository } from "@/repositories/permission.repository.ts"
import {
  createPermissionSchema,
  listPermissionsQuerySchema,
  updatePermissionSchema,
} from "@/schemas/permission.schema.ts"
import { PermissionService } from "@/services/permission.service.ts"

import express from "express"

/**
 * permissionRoutes defines the API endpoints for dynamic RBAC Permission CRUD operations.
 */
const permissionRoutes = express.Router()

// Wire dependency injection layers
const repository = new PrismaPermissionRepository(prisma)
const service = new PermissionService(repository)
const controller = new PermissionController(service)

// All endpoints require user authentication
permissionRoutes.use(authenticate)

// GET /permissions - List paginated permissions
permissionRoutes.get(
  "/",
  requirePermission(PERMISSION_CODE.PERMISSION_READ),
  validate(listPermissionsQuerySchema, "query"),
  controller.list as express.RequestHandler,
)

// GET /permissions/:id - Retrieve single permission details
permissionRoutes.get(
  "/:id",
  requirePermission(PERMISSION_CODE.PERMISSION_READ),
  controller.getOne as express.RequestHandler,
)

// POST /permissions - Create new permission
permissionRoutes.post(
  "/",
  requirePermission(PERMISSION_CODE.PERMISSION_CREATE),
  validate(createPermissionSchema, "body"),
  controller.create as express.RequestHandler,
)

// PUT /permissions/:id - Fully/Partially update permission details
permissionRoutes.put(
  "/:id",
  requirePermission(PERMISSION_CODE.PERMISSION_UPDATE),
  validate(updatePermissionSchema, "body"),
  controller.update as express.RequestHandler,
)

// DELETE /permissions/:id - Soft delete permission
permissionRoutes.delete(
  "/:id",
  requirePermission(PERMISSION_CODE.PERMISSION_DELETE),
  controller.delete as express.RequestHandler,
)

export default permissionRoutes
