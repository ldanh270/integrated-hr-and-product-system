import { EmployeeContractController } from "@/controllers/employee-contract.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaEmployeeContractRepository } from "@/repositories/employee-contract.repository.ts"
import { EmployeeContractService } from "@/services/employee-contract.service.ts"

import { Router } from "express"

const router = Router()

// Init DI
const repository = new PrismaEmployeeContractRepository(prisma)
const service = new EmployeeContractService(repository)
const controller = new EmployeeContractController(service)

// Apply authenticate middleware to all routes
router.use(authenticate)

// Routes
router.get("/", controller.list)
router.get("/expiring", controller.getExpiring)
router.get("/:id", controller.getById)
router.get("/employee/:employeeId", controller.getByEmployeeId)

router.post("/", controller.create)
router.patch("/:id", controller.update)
router.post("/:id/terminate", controller.terminate)
router.post("/:id/renew", controller.renew)
router.delete("/:id", controller.delete)

export default router
