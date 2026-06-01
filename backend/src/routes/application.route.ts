import { ROLE } from "@/configs/role.config.ts"
import { ApplicationController } from "@/controllers/application.controller.ts"
import Application from "@/entities/attendance/Application.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { MongoApplicationRepository } from "@/repositories/application.repository.ts"
import { ApplicationService } from "@/services/application.service.ts"

import express from "express"

const applicationRoutes = express.Router()

const repository = new MongoApplicationRepository(Application as any)
const service = new ApplicationService(repository)
const controller = new ApplicationController(service)

// All routes in this file require authentication
applicationRoutes.use(authenticate)

// Employees can submit applications and view their own applications
applicationRoutes.get("/employee/:employeeId", controller.listEmployeeApplications)

// Only admins, HR managers, and managers can approve applications
applicationRoutes.post("/", controller.submit)

// In a real app, processorId would come from req.user, not the request body
applicationRoutes.patch(
  "/:id/approve",
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.approve,
)

export default applicationRoutes
