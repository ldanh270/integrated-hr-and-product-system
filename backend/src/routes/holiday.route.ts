import { HolidayController } from "@/controllers/holiday.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaHolidayRepository } from "@/repositories/holiday.repository.ts"
import { HolidayService } from "@/services/holiday.service.ts"

import express from "express"

const holidayRoutes = express.Router()

const repository = new PrismaHolidayRepository(prisma)
const service = new HolidayService(repository)
const controller = new HolidayController(service)

holidayRoutes.use(authenticate)

holidayRoutes.get("/", controller.list)
holidayRoutes.get("/check", controller.checkHoliday)

holidayRoutes.post("/", requirePermission("attendance.update"), controller.create)
holidayRoutes.patch("/:id", requirePermission("attendance.update"), controller.update)
holidayRoutes.delete("/:id", requirePermission("attendance.delete"), controller.delete)

export default holidayRoutes
