import { ROLE } from "@/configs/entities/employee.config.ts"
import {
  DAY_OF_WEEK_VALUES,
  WEEKLY_SCHEDULE_SETTINGS_ID,
} from "@/configs/entities/attendance.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ScheduleController } from "@/controllers/schedule.controller.ts"
import { prisma } from "@/libs/database.ts"
import { getDefaultWeeklyScheduleSettings } from "@/libs/weekly-schedule-cron.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { PrismaShiftScheduleRepository } from "@/repositories/schedule.repository.ts"
import { ScheduleService } from "@/services/schedule.service.ts"
import { AppError } from "@/utils/error.util.ts"

import express from "express"

const scheduleRoutes = express.Router()

const scheduleRepo = new PrismaShiftScheduleRepository(prisma)
const employeeShiftRepo = new PrismaEmployeeShiftRepository(prisma)
const service = new ScheduleService(scheduleRepo, employeeShiftRepo)
const controller = new ScheduleController(service)

scheduleRoutes.use(authenticate)

scheduleRoutes.get("/my", controller.getEmployeeSchedule)
scheduleRoutes.get("/my/all", controller.listEmployeeSchedules)

scheduleRoutes.get(
  "/employee/:employeeId",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.getEmployeeScheduleById,
)
scheduleRoutes.get(
  "/employee/:employeeId/all",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.listEmployeeSchedulesById,
)

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
scheduleRoutes.post(
  "/generate/preview",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.previewGeneratedShifts,
)
scheduleRoutes.post(
  "/generate",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.generateShifts,
)

scheduleRoutes.get(
  "/settings",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  async (_req, res, next) => {
    try {
      const settings = await prisma.weeklyScheduleSettings.findUnique({
        where: { id: WEEKLY_SCHEDULE_SETTINGS_ID },
      })
      res.json({ data: settings ?? getDefaultWeeklyScheduleSettings(), error: null })
    } catch (error) {
      next(error)
    }
  },
)

scheduleRoutes.put(
  "/settings",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  async (req, res, next) => {
    try {
      const { triggerDayOfWeek, triggerHour, triggerMinute } = req.body
      const updatedById = (req as { user?: { empId?: string } }).user?.empId
      if (!updatedById) {
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.UNKNOWN)
      }

      const day = Number(triggerDayOfWeek)
      const hour = triggerHour !== undefined ? Number(triggerHour) : 7
      const minute = triggerMinute !== undefined ? Number(triggerMinute) : 0

      if (!DAY_OF_WEEK_VALUES.includes(day as (typeof DAY_OF_WEEK_VALUES)[number])) {
        throw new AppError(
          "Ngày kích hoạt phải từ Chủ nhật (0) đến Thứ bảy (6)",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.VALIDATION,
        )
      }
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        throw new AppError(
          "Thời gian kích hoạt không hợp lệ",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.VALIDATION,
        )
      }

      const settings = await prisma.weeklyScheduleSettings.upsert({
        where: { id: WEEKLY_SCHEDULE_SETTINGS_ID },
        create: {
          id: WEEKLY_SCHEDULE_SETTINGS_ID,
          triggerDayOfWeek: day,
          triggerHour: hour,
          triggerMinute: minute,
          updatedById,
        },
        update: {
          triggerDayOfWeek: day,
          triggerHour: hour,
          triggerMinute: minute,
          updatedById,
        },
      })
      res.json({ data: settings, error: null })
    } catch (error) {
      next(error)
    }
  },
)

export default scheduleRoutes
