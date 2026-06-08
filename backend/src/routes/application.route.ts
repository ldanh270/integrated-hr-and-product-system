import { ROLE } from "@/configs/entities/employee.config.ts"
import { ApplicationController } from "@/controllers/application.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { ApplicationService } from "@/services/application.service.ts"

import express from "express"

const applicationRoutes = express.Router()

const repository = new PrismaApplicationRepository(prisma)
const service = new ApplicationService(repository)
const controller = new ApplicationController(service)

// All routes in this file require authentication
applicationRoutes.use(authenticate)

// Employees can submit applications and view their own applications
applicationRoutes.post("/", controller.submit)
applicationRoutes.get("/my", controller.listEmployeeApplications)
applicationRoutes.get("/employee/:employeeId", controller.listEmployeeApplications)
applicationRoutes.get("/:id", controller.getDetail)

// Approval routes
applicationRoutes.patch(
  "/:id/approve",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.TEAM_LEADER),
  controller.approve,
)

export default applicationRoutes
