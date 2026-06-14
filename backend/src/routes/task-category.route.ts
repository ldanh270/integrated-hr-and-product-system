import { TaskCategoryController } from "@/controllers/task-category.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { rateLimiter } from "@/middlewares/rate-limit.middleware.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PrismaTaskCategoryRepository } from "@/repositories/task-category.repository.ts"
import { TaskCategoryService } from "@/services/task-category.service.ts"
import express from "express"

const taskCategoryRoutes = express.Router({ mergeParams: true })

const projectRepository = new PrismaProjectRepository(prisma)
const repository = new PrismaTaskCategoryRepository(prisma)
const service = new TaskCategoryService(repository, projectRepository)
const controller = new TaskCategoryController(service)

// Require rate limiting and authentication for all category endpoints
taskCategoryRoutes.use(rateLimiter)
taskCategoryRoutes.use(authenticate)

taskCategoryRoutes.get("/", controller.list)
taskCategoryRoutes.post("/", controller.create)
taskCategoryRoutes.patch("/:id", controller.update)
taskCategoryRoutes.delete("/:id", controller.delete)

export default taskCategoryRoutes
