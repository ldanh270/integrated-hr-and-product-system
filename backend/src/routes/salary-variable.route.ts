import { Router } from "express"

import { SalaryVariableController } from "@/controllers/salary-variable.controller.ts"
import { prisma } from "@/libs/database.ts"
import { ROLE } from "@/configs/entities/employee.config.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaSalaryVariableRepository } from "@/repositories/salary-variable.repository.ts"
import { SalaryVariableService } from "@/services/salary-variable.service.ts"

const router = Router()

const repo = new PrismaSalaryVariableRepository(prisma)
const service = new SalaryVariableService(repo)
const controller = new SalaryVariableController(service)

// Protect all routes
router.use(authenticate)
router.use(authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER))

router.get("/", controller.listVariables)
router.get("/:id", controller.getVariable)
router.post("/", controller.createVariable)
router.put("/:id", controller.updateVariable)
router.delete("/:id", controller.deleteVariable)

export default router
