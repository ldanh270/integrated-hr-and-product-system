import { RegimeCategoryController } from "@/controllers/regime-category.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaRegimeCategoryRepository } from "@/repositories/regime-category.repository.ts"
import { RegimeCategoryService } from "@/services/regime-category.service.ts"

import express from "express"

const regimeCategoryRoutes = express.Router()

const repository = new PrismaRegimeCategoryRepository(prisma)
const service = new RegimeCategoryService(repository)
const controller = new RegimeCategoryController(service)

// All endpoints require authentication; no extra permission check (all employees can CRUD)
regimeCategoryRoutes.use(authenticate)

regimeCategoryRoutes.get("/", controller.list)
regimeCategoryRoutes.post("/", controller.create)
regimeCategoryRoutes.patch("/:id", controller.update)
regimeCategoryRoutes.delete("/:id", controller.delete)

export default regimeCategoryRoutes
