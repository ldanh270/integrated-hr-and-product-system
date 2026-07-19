import { Router } from "express"

import { prisma } from "@/libs/database.ts"
import { requireAuth } from "@/middlewares/auth.middleware.ts"

import { EmployeeContractController } from "@/controllers/employee-contract.controller.ts"
import { PrismaEmployeeContractRepository } from "@/repositories/employee-contract.repository.ts"
import { EmployeeContractService } from "@/services/employee-contract.service.ts"

const router = Router()

// Init DI
const repository = new PrismaEmployeeContractRepository(prisma)
const service = new EmployeeContractService(repository)
const controller = new EmployeeContractController(service)

// Routes
router.get("/", requireAuth(), controller.list)
router.get("/expiring", requireAuth(), controller.getExpiring)
router.get("/:id", requireAuth(), controller.getById)
router.get("/employee/:employeeId", requireAuth(), controller.getByEmployeeId)

router.post("/", requireAuth(), controller.create)
router.patch("/:id", requireAuth(), controller.update)
router.post("/:id/terminate", requireAuth(), controller.terminate)
router.post("/:id/renew", requireAuth(), controller.renew)
router.delete("/:id", requireAuth(), controller.delete)

export default router
