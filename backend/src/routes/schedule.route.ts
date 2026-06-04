import { ROLE } from "@/configs/entities/employee.config.ts"
import { ScheduleController } from "@/controllers/schedule.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { PrismaShiftScheduleRepository } from "@/repositories/schedule.repository.ts"
import { ScheduleService } from "@/services/schedule.service.ts"

import express from "express"

const scheduleRoutes = express.Router()

const scheduleRepo = new PrismaShiftScheduleRepository(prisma)
const employeeShiftRepo = new PrismaEmployeeShiftRepository(prisma)
const service = new ScheduleService(scheduleRepo, employeeShiftRepo)
const controller = new ScheduleController(service)

scheduleRoutes.use(authenticate)

scheduleRoutes.get("/employee/:employeeId", controller.getEmployeeSchedule)

scheduleRoutes.post(
  "/assign",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.assignSchedule,
)
scheduleRoutes.post(
  "/override",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.overrideShift,
)

export default scheduleRoutes
