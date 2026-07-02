import { ApplicationController } from "@/controllers/application.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { ApplicationService } from "@/services/application.service.ts"

import express from "express"

const applicationRoutes = express.Router()

const repository = new PrismaApplicationRepository(prisma)
const service = new ApplicationService(repository)
const controller = new ApplicationController(service)

// All routes require authentication
applicationRoutes.use(authenticate)

// ─── Employee endpoints ───────────────────────────────────────

// Submit a new application (any authenticated employee)
applicationRoutes.post("/", controller.submit)

// List own applications (with pagination + filters)
applicationRoutes.get("/me", controller.listMine)

// Get specific application by ID (own or manager)
applicationRoutes.get("/:id", controller.getById)

// Cancel own pending application
applicationRoutes.patch("/:id/cancel", controller.cancel)

// ─── Manager endpoints ────────────────────────────────────────

// List all applications across all employees
applicationRoutes.get(
  "/",
  requirePermission("application.read"),
  controller.listAll,
)

// List applications for a specific employee
applicationRoutes.get(
  "/employee/:employeeId",
  requirePermission("application.read"),
  controller.listByEmployee,
)

// Approve an application (sets status=approved)
applicationRoutes.patch(
  "/:id/approve",
  requirePermission("application.approve"),
  controller.approve,
)

// Reject an application with a mandatory rejectReason
applicationRoutes.patch(
  "/:id/reject",
  requirePermission("application.approve"),
  controller.reject,
)

export default applicationRoutes
