import { ROLE } from "@/configs/entities/employee.config.ts"
import { HolidayController } from "@/controllers/holiday.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaHolidayRepository } from "@/repositories/holiday.repository.ts"
import { HolidayService } from "@/services/holiday.service.ts"

import express from "express"

const holidayRoutes = express.Router()

const repository = new PrismaHolidayRepository(prisma)
const service = new HolidayService(repository)
const controller = new HolidayController(service)

holidayRoutes.use(authenticate)

holidayRoutes.get("/check", controller.checkHoliday)

holidayRoutes.post("/", authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER), controller.create)

export default holidayRoutes
