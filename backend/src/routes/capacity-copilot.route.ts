import { PERMISSION_CODE } from "@/configs/entities/permission.config.ts"
import { CapacityCopilotController } from "@/controllers/capacity-copilot.controller.ts"
/**
 * Express routes for project capacity forecasting.
 */
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaCapacityCopilotRepository } from "@/repositories/capacity-copilot.repository.ts"
import { CapacityCopilotService } from "@/services/capacity-copilot.service.ts"

import express from "express"

const capacityCopilotRoutes = express.Router()

const repository = new PrismaCapacityCopilotRepository(prisma)
const service = new CapacityCopilotService(repository)
const controller = new CapacityCopilotController(service)

// Dedicated route keeps capacity forecasting separate from Project Task assignment AI.
capacityCopilotRoutes.use(authenticate)
capacityCopilotRoutes.post(
  "/projects/:projectId/forecast",
  requirePermission(PERMISSION_CODE.PROJECT_UPDATE),
  controller.forecastProjectCapacity,
)

export default capacityCopilotRoutes
