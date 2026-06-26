import { ProjectController } from "@/controllers/project.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { ProjectService } from "@/services/project.service.ts"
import express from "express"
const projectRoutes = express.Router()
const employeeRepository = new PrismaEmployeeRepository(prisma)
const repository = new PrismaProjectRepository(prisma)
const service = new ProjectService(repository, employeeRepository)
const controller = new ProjectController(service)
// All project routes require authentication (must have JWT token)
projectRoutes.use(authenticate)
// Project CRUD
projectRoutes.get("/", controller.list)
projectRoutes.get("/:id", controller.getOne)
projectRoutes.post("/", controller.create)
projectRoutes.patch("/:id", controller.update)
projectRoutes.delete("/:id", controller.delete)
// Project Members
projectRoutes.get("/:id/members", controller.getMembers)
projectRoutes.post("/:id/members", controller.addMember)
// PT member rate/mode — payroll and attendance rules depend on these fields.
projectRoutes.patch("/:id/members/:employeeId", controller.updateMember)
projectRoutes.delete("/:id/members/:employeeId", controller.removeMember)

// Gantt Chart Data
projectRoutes.get("/:id/gantt", controller.getGanttData)

export default projectRoutes