import { SpentTimeController } from "@/controllers/spent-time.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaAttendanceRepository } from "@/repositories/attendance.repository.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PrismaSpentTimeRepository } from "@/repositories/spent-time.repository.ts"
import { PrismaTaskRepository } from "@/repositories/task.repository.ts"
import { SpentTimeService } from "@/services/spent-time.service.ts"
import express from "express"
import rateLimit from "express-rate-limit"

import { ENVIRONMENT, RATE_LIMIT, ENV_ENVIRONMENT } from "@/configs/system/server.config.ts"

const spentTimeRoutes = express.Router({ mergeParams: true })

const spentTimeLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: ENV_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ? RATE_LIMIT.MAX_LIMIT_DEV : RATE_LIMIT.MAX_LIMIT_PROD,
})

const projectRepository = new PrismaProjectRepository(prisma)
const taskRepository = new PrismaTaskRepository(prisma)
const attendanceRepository = new PrismaAttendanceRepository(prisma)
const repository = new PrismaSpentTimeRepository(prisma)
const service = new SpentTimeService(repository, taskRepository, projectRepository, attendanceRepository)
const controller = new SpentTimeController(service)

// All spent time routes require rate limiting and authentication
spentTimeRoutes.use(spentTimeLimiter)
spentTimeRoutes.use(authenticate)

spentTimeRoutes.get("/", controller.list)
spentTimeRoutes.get("/:id", controller.getOne)
spentTimeRoutes.post("/", controller.create)
spentTimeRoutes.post("/:id/approve", controller.approve)
spentTimeRoutes.post("/:id/reject", controller.reject)
spentTimeRoutes.patch("/:id", controller.update)
spentTimeRoutes.delete("/:id", controller.delete)

export default spentTimeRoutes
