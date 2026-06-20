import { SpentTimeController } from "@/controllers/spent-time.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PrismaSpentTimeRepository } from "@/repositories/spent-time.repository.ts"
import { PrismaTaskRepository } from "@/repositories/task.repository.ts"
import { SpentTimeService } from "@/services/spent-time.service.ts"
import express from "express"
import rateLimit from "express-rate-limit"

const spentTimeRoutes = express.Router({ mergeParams: true })

const spentTimeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 100000 : 100, // limit each IP to 100 requests per window in prod
})

const projectRepository = new PrismaProjectRepository(prisma)
const taskRepository = new PrismaTaskRepository(prisma)
const repository = new PrismaSpentTimeRepository(prisma)
const service = new SpentTimeService(repository, taskRepository, projectRepository)
const controller = new SpentTimeController(service)

// All spent time routes require rate limiting and authentication
spentTimeRoutes.use(spentTimeLimiter)
spentTimeRoutes.use(authenticate)

spentTimeRoutes.get("/", controller.list)
spentTimeRoutes.get("/:id", controller.getOne)
spentTimeRoutes.post("/", controller.create)
spentTimeRoutes.patch("/:id", controller.update)
spentTimeRoutes.delete("/:id", controller.delete)

export default spentTimeRoutes
