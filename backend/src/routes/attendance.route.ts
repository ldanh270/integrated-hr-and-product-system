import { AttendanceController } from "@/controllers/attendance.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaAttendanceRepository } from "@/repositories/attendance.repository.ts"
import { PrismaEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { PrismaHolidayRepository } from "@/repositories/holiday.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaShiftScheduleRepository } from "@/repositories/schedule.repository.ts"
import { PrismaWorkingShiftRepository } from "@/repositories/shift.repository.ts"
import { AttendanceService } from "@/services/attendance.service.ts"

import express from "express"

const attendanceRoutes = express.Router()

const attendanceRepo = new PrismaAttendanceRepository(prisma)
const employeeShiftRepo = new PrismaEmployeeShiftRepository(prisma)
const scheduleRepo = new PrismaShiftScheduleRepository(prisma)
const holidayRepo = new PrismaHolidayRepository(prisma)
const workingShiftRepo = new PrismaWorkingShiftRepository(prisma)
const employeeRepo = new PrismaEmployeeRepository(prisma)

const service = new AttendanceService(
  attendanceRepo,
  employeeShiftRepo,
  scheduleRepo,
  holidayRepo,
  workingShiftRepo,
  employeeRepo,
)
const controller = new AttendanceController(service)

attendanceRoutes.use(authenticate)

attendanceRoutes.get(
  "/export",
  requirePermission("attendance.export"),
  controller.exportReport,
)

attendanceRoutes.get("/", controller.queryRecords)

attendanceRoutes.post("/check-in", controller.checkIn)
attendanceRoutes.post("/check-out", controller.checkOut)
attendanceRoutes.post("/scan", controller.scan)

export default attendanceRoutes
