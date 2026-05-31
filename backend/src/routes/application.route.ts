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

applicationRoutes.use(authenticate)

applicationRoutes.get("/employee/:employeeId", controller.listEmployeeApplications)
applicationRoutes.post("/", controller.submit)

applicationRoutes.patch("/:id/approve", authorizeRoles("admin", "hr_manager", "manager"), controller.approve)

export default applicationRoutes
