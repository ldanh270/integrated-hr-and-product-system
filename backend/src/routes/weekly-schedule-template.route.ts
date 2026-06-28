import { ROLE } from "@/configs/entities/employee.config.ts"
import { WeeklyScheduleTemplateController } from "@/controllers/weekly-schedule-template.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { PrismaShiftScheduleRepository } from "@/repositories/schedule.repository.ts"
import { PrismaWeeklyScheduleTemplateRepository } from "@/repositories/weekly-schedule-template.repository.ts"
import { WeeklyScheduleTemplateService } from "@/services/weekly-schedule-template.service.ts"

import express from "express"

const weeklyScheduleTemplateRoutes = express.Router()

const templateRepo = new PrismaWeeklyScheduleTemplateRepository(prisma)
const scheduleRepo = new PrismaShiftScheduleRepository(prisma)
const employeeShiftRepo = new PrismaEmployeeShiftRepository(prisma)
// employeeRepo: WeeklyScheduleTemplateService blocks apply for PART_TIME (project Spent Time model).
const employeeRepo = new PrismaEmployeeRepository(prisma)
const service = new WeeklyScheduleTemplateService(
  templateRepo,
  scheduleRepo,
  employeeShiftRepo,
  employeeRepo,
)
const controller = new WeeklyScheduleTemplateController(service)

const adminRoles = [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER]

weeklyScheduleTemplateRoutes.use(authenticate)
weeklyScheduleTemplateRoutes.use(authorizeRoles(...adminRoles))

weeklyScheduleTemplateRoutes.get("/", controller.list)
weeklyScheduleTemplateRoutes.get("/:id", controller.getOne)
weeklyScheduleTemplateRoutes.post("/", controller.create)
weeklyScheduleTemplateRoutes.patch("/:id", controller.update)
weeklyScheduleTemplateRoutes.delete("/:id", controller.delete)
weeklyScheduleTemplateRoutes.post("/:id/apply", controller.apply)

export default weeklyScheduleTemplateRoutes
