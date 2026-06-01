import { ROLE } from "@/configs/role.config.ts"
import { ScheduleController } from "@/controllers/schedule.controller.ts"
import EmployeeShift from "@/entities/attendance/EmployeeShift.ts"
import ShiftSchedule from "@/entities/attendance/ShiftSchedule.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { MongoEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { MongoShiftScheduleRepository } from "@/repositories/schedule.repository.ts"
import { ScheduleService } from "@/services/schedule.service.ts"

import express from "express"

const scheduleRoutes = express.Router()

const scheduleRepo = new MongoShiftScheduleRepository(ShiftSchedule as any)
const employeeShiftRepo = new MongoEmployeeShiftRepository(EmployeeShift as any)
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
