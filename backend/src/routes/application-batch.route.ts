import { SYSTEM_ROLE } from "@/configs/entities/employee.config.ts"
import { ApplicationBatchController } from "@/controllers/application-batch.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/permission.middleware.ts"
import { PrismaApplicationBatchRepository } from "@/repositories/application-batch.repository.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { ApplicationBatchService } from "@/services/application-batch.service.ts"
import { NotificationService } from "@/services/notification.service.ts"
import { NotificationRepository } from "@/repositories/notification.repository.ts"

import express from "express"

const applicationBatchRoutes = express.Router()

const notifRepo = new NotificationRepository()
const notifService = new NotificationService(notifRepo)
const batchRepo = new PrismaApplicationBatchRepository(prisma)
const applicationRepo = new PrismaApplicationRepository(prisma)
const batchService = new ApplicationBatchService(batchRepo, notifService, applicationRepo)
const batchController = new ApplicationBatchController(batchService)

// All routes require authentication
applicationBatchRoutes.use(authenticate)

// ─── Employee endpoints ───────────────────────────────────────

// Submit a new batch application
applicationBatchRoutes.post("/", batchController.submitBatch)

// List own batches (with pagination + filters)
applicationBatchRoutes.get("/me", batchController.listMine)

// Get specific batch by ID
applicationBatchRoutes.get("/:id", batchController.getById)

// Cancel own pending batch
applicationBatchRoutes.patch("/:id/cancel", batchController.cancelBatch)

// ─── Manager endpoints ────────────────────────────────────────

// List all batches (managers & partners)
applicationBatchRoutes.get(
  "/",
  batchController.listAll,
)

export default applicationBatchRoutes
