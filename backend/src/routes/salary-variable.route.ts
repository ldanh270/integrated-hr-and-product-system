import { SalaryVariableController } from "@/controllers/salary-variable.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaSalaryVariableRepository } from "@/repositories/salary-variable.repository.ts"
import { SalaryVariableService } from "@/services/salary-variable.service.ts"

import { Router } from "express"

const router = Router()

const repo = new PrismaSalaryVariableRepository(prisma)
const service = new SalaryVariableService(repo)
const controller = new SalaryVariableController(service)

// Protect all routes
router.use(authenticate)
router.use(requirePermission("payroll.read"))

router.get("/", controller.listVariables)
router.get("/:id", controller.getVariable)
router.post("/", requirePermission("payroll.create"), controller.createVariable)
router.put("/:id", requirePermission("payroll.update"), controller.updateVariable)
router.delete("/:id", requirePermission("payroll.delete"), controller.deleteVariable)

export default router
