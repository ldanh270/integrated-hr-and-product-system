import { AttendanceController } from "@/controllers/attendance.controller.ts"
import AttendanceRecord from "@/entities/attendance/AttendanceRecord.ts"
import EmployeeShift from "@/entities/attendance/EmployeeShift.ts"
import ShiftSchedule from "@/entities/attendance/ShiftSchedule.ts"
import HolidayCalendar from "@/entities/attendance/HolidayCalendar.ts"
import WorkingShift from "@/entities/attendance/WorkingShift.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"

import { MongoAttendanceRepository } from "@/repositories/attendance.repository.ts"
import { MongoEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { MongoShiftScheduleRepository } from "@/repositories/schedule.repository.ts"
import { MongoHolidayRepository } from "@/repositories/holiday.repository.ts"
import { MongoWorkingShiftRepository } from "@/repositories/shift.repository.ts"
import { AttendanceService } from "@/services/attendance.service.ts"

import express from "express"

const attendanceRoutes = express.Router()

const attendanceRepo = new MongoAttendanceRepository(AttendanceRecord as any)
const employeeShiftRepo = new MongoEmployeeShiftRepository(EmployeeShift as any)
const scheduleRepo = new MongoShiftScheduleRepository(ShiftSchedule as any)
const holidayRepo = new MongoHolidayRepository(HolidayCalendar as any)
const workingShiftRepo = new MongoWorkingShiftRepository(WorkingShift as any)

const service = new AttendanceService(
  attendanceRepo,
  employeeShiftRepo,
  scheduleRepo,
  holidayRepo,
  workingShiftRepo
)
const controller = new AttendanceController(service)

attendanceRoutes.use(authenticate)

attendanceRoutes.get("/", authorizeRoles("admin", "hr_manager", "manager"), controller.queryRecords)

attendanceRoutes.post("/check-in", controller.checkIn)
attendanceRoutes.post("/check-out", controller.checkOut)
attendanceRoutes.post("/scan", controller.scan)

export default attendanceRoutes
