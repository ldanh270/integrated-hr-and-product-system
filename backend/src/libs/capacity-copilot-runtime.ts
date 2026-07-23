/**
 * Shared Capacity Copilot runtime.
 * Routes and availability update jobs use the same service instance so auto-run snapshots are reusable.
 */
import { prisma } from "@/libs/database.ts"
import { PrismaCapacityCopilotRepository } from "@/repositories/capacity-copilot.repository.ts"
import { CapacityCopilotService } from "@/services/capacity-copilot.service.ts"

const capacityCopilotRepository = new PrismaCapacityCopilotRepository(prisma)

export const capacityCopilotService = new CapacityCopilotService(capacityCopilotRepository)
