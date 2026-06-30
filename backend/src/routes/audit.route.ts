import { AuditController } from "@/controllers/audit.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { validate } from "@/middlewares/validate.middleware.ts"
import { PrismaAuditRepository } from "@/repositories/audit.repository.ts"
import { listAuditQuerySchema } from "@/schemas/audit.schema.ts"
import { AuditService } from "@/services/audit.service.ts"

import express from "express"

/**
 * auditRoutes defines the API endpoints for authorization audit log queries.
 */
const auditRoutes = express.Router()

// Wire dependency injection layers
const repository = new PrismaAuditRepository(prisma)
const service = new AuditService(repository)
const controller = new AuditController(service)

// Require authentication for all endpoints
auditRoutes.use(authenticate)

// GET /api/audit - List all audit logs with query filters/pagination
auditRoutes.get(
  "/audit",
  requirePermission("audit.read"),
  validate(listAuditQuerySchema, "query"),
  controller.list as express.RequestHandler,
)

// GET /api/audit/:id - Retrieve specific audit log by ID
auditRoutes.get(
  "/audit/:id",
  requirePermission("audit.read"),
  controller.getOne as express.RequestHandler,
)

// GET /api/employees/:id/audit - List audit logs targeting a specific employee
auditRoutes.get(
  "/employees/:id/audit",
  requirePermission("audit.read"),
  validate(listAuditQuerySchema.omit({ targetEmployeeId: true }), "query"),
  controller.listByEmployee as express.RequestHandler,
)

// GET /api/roles/:id/audit - List audit logs targeting a specific role
auditRoutes.get(
  "/roles/:id/audit",
  requirePermission("audit.read"),
  validate(listAuditQuerySchema.omit({ targetRoleId: true }), "query"),
  controller.listByRole as express.RequestHandler,
)

export default auditRoutes
