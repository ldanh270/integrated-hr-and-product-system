import { ProjectController } from "@/controllers/project.controller.ts"
import { ProjectTaskStatusController } from "@/controllers/project-task-status.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PrismaTaskRepository } from "@/repositories/task.repository.ts"
import { ProjectTaskStatusRepository } from "@/repositories/project-task-status.repository.ts"
import { ProjectService } from "@/services/project.service.ts"
import { ProjectTaskStatusService } from "@/services/project-task-status.service.ts"
import express from "express"

const projectRoutes = express.Router()
const employeeRepository = new PrismaEmployeeRepository(prisma)
const repository = new PrismaProjectRepository(prisma)
const taskRepository = new PrismaTaskRepository(prisma)
const statusRepository = new ProjectTaskStatusRepository(prisma)
const statusService = new ProjectTaskStatusService(statusRepository, repository, taskRepository)
const service = new ProjectService(repository, employeeRepository, prisma, statusService)

const controller = new ProjectController(service)
const statusController = new ProjectTaskStatusController(statusService)

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

// Project Task Statuses (Kanban Columns) CRUD
projectRoutes.get("/:projectId/statuses", statusController.list)
projectRoutes.post("/:projectId/statuses", statusController.create)
projectRoutes.patch("/:projectId/statuses/:id", statusController.update)
projectRoutes.delete("/:projectId/statuses/:id", statusController.delete)

export default projectRoutes