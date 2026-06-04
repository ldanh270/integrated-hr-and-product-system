import { ROLE } from "@/configs/entities/employee.config.ts"
import { ShiftController } from "@/controllers/shift.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaWorkingShiftRepository } from "@/repositories/shift.repository.ts"
import { ShiftService } from "@/services/shift.service.ts"

import express from "express"

const shiftRoutes = express.Router()

const repository = new PrismaWorkingShiftRepository(prisma)
const service = new ShiftService(repository)
const controller = new ShiftController(service)

shiftRoutes.use(authenticate)

shiftRoutes.get("/", controller.list)
shiftRoutes.get("/:id", controller.getOne)

shiftRoutes.post(
  "/",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.create,
)
shiftRoutes.patch(
  "/:id",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.update,
)

export default shiftRoutes
