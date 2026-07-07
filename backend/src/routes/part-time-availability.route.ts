import {
  PartTimeAvailabilityController,
} from "@/controllers/part-time-availability.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { PrismaPartTimeAvailabilityRepository } from "@/repositories/part-time-availability.repository.ts"
import { PrismaWorkingShiftRepository } from "@/repositories/shift.repository.ts"
import { PartTimeAvailabilityService } from "@/services/part-time-availability.service.ts"

import express from "express"

const partTimeAvailabilityRoutes = express.Router()

// Manual DI: availability repo + shift repos needed to validate slots and persist assigned shifts.
const availabilityRepo = new PrismaPartTimeAvailabilityRepository(prisma)
const employeeRepo = new PrismaEmployeeRepository(prisma)
const employeeShiftRepo = new PrismaEmployeeShiftRepository(prisma)
const workingShiftRepo = new PrismaWorkingShiftRepository(prisma)
const service = new PartTimeAvailabilityService(
  availabilityRepo,
  employeeRepo,
  employeeShiftRepo,
  workingShiftRepo,
)
const controller = new PartTimeAvailabilityController(service)

partTimeAvailabilityRoutes.use(authenticate)

// Employee self-service — any authenticated PT worker can declare their own week.
partTimeAvailabilityRoutes.get("/mine", controller.getMine)
partTimeAvailabilityRoutes.put("/mine", controller.upsertMine)

// Admin-only: roster for a week, per-employee drill-down, assign shifts from submitted availability.
partTimeAvailabilityRoutes.get(
  "/",
  requirePermission("attendance.update"),
  controller.listForWeek,
)
partTimeAvailabilityRoutes.get(
  "/employee/:employeeId",
  requirePermission("attendance.update"),
  controller.getByEmployee,
)
partTimeAvailabilityRoutes.post(
  "/:id/assign-shifts",
  requirePermission("attendance.update"),
  controller.assignShifts,
)

// No approve/reject routes: workflow is submit → admin assign; submitted rows are assignable immediately.

export default partTimeAvailabilityRoutes
