import { ROLE } from "@/configs/entities/employee.config.ts"
import { ApplicationController } from "@/controllers/application.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { ApplicationService } from "@/services/application.service.ts"

import express from "express"

import { NotificationService } from "@/services/notification.service.ts"
import { NotificationRepository } from "@/repositories/notification.repository.ts"

const applicationRoutes = express.Router()

const notifRepo = new NotificationRepository()
const notifService = new NotificationService(notifRepo)
const repository = new PrismaApplicationRepository(prisma)
const service = new ApplicationService(repository, notifService)
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

// Partner approves shift swap
applicationRoutes.patch("/:id/partner-approve", controller.partnerApprove)

// ─── Manager endpoints ────────────────────────────────────────

// List all applications across all employees (HR / GM / admin / TL)
applicationRoutes.get(
  "/",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.TEAM_LEADER),
  controller.listAll,
)

// List applications for a specific employee (HR / GM / admin)
applicationRoutes.get(
  "/employee/:employeeId",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.TEAM_LEADER),
  controller.listByEmployee,
)

// Approve an application (sets status=approved)
applicationRoutes.patch(
  "/:id/approve",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.TEAM_LEADER),
  controller.approve,
)

// Reject an application with a mandatory rejectReason
applicationRoutes.patch(
  "/:id/reject",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.TEAM_LEADER),
  controller.reject,
)

export default applicationRoutes
