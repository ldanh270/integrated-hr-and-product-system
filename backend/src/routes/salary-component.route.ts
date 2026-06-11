import { ROLE } from "@/configs/entities/employee.config.ts"
import { SalaryComponentController } from "@/controllers/salary-component.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaSalaryComponentRepository } from "@/repositories/salary-component.repository.ts"
import { SalaryComponentService } from "@/services/salary-component.service.ts"

import express from "express"

const salaryComponentRoutes = express.Router()

const repo = new PrismaSalaryComponentRepository(prisma)
const service = new SalaryComponentService(repo)
const controller = new SalaryComponentController(service)

salaryComponentRoutes.use(authenticate)
salaryComponentRoutes.use(authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER))

salaryComponentRoutes.get("/", controller.listComponents)
salaryComponentRoutes.post("/", controller.createComponent)
salaryComponentRoutes.put("/:id", controller.updateComponent)
salaryComponentRoutes.delete("/:id", controller.deleteComponent)
salaryComponentRoutes.post("/validate", controller.validateFormula)

export default salaryComponentRoutes
