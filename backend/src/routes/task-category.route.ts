import { TaskCategoryController } from "@/controllers/task-category.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PrismaTaskCategoryRepository } from "@/repositories/task-category.repository.ts"
import { TaskCategoryService } from "@/services/task-category.service.ts"
import express from "express"
import rateLimit from "express-rate-limit"

const taskCategoryRoutes = express.Router({ mergeParams: true })

const taskCategoryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})

const projectRepository = new PrismaProjectRepository(prisma)
const repository = new PrismaTaskCategoryRepository(prisma)
const service = new TaskCategoryService(repository, projectRepository)
const controller = new TaskCategoryController(service)

// Apply rate limiting to all category endpoints
taskCategoryRoutes.use(taskCategoryRateLimiter)

// Require authentication for all category endpoints
taskCategoryRoutes.use(authenticate)

taskCategoryRoutes.get("/", controller.list)
taskCategoryRoutes.post("/", controller.create)
taskCategoryRoutes.patch("/:id", controller.update)
taskCategoryRoutes.delete("/:id", controller.delete)

export default taskCategoryRoutes
