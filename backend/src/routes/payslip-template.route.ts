import { ROLE } from "@/configs/entities/employee.config.ts"
import { PayslipTemplateController } from "@/controllers/payslip-template.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaPayslipTemplateRepository } from "@/repositories/payslip-template.repository.ts"
import { PayslipTemplateService } from "@/services/payslip-template.service.ts"

import express from "express"

const payslipTemplateRoutes = express.Router()

const repo = new PrismaPayslipTemplateRepository(prisma)
const service = new PayslipTemplateService(repo)
const controller = new PayslipTemplateController(service)

payslipTemplateRoutes.use(authenticate)
payslipTemplateRoutes.use(authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER))

payslipTemplateRoutes.get("/", controller.listTemplates)
payslipTemplateRoutes.post("/", controller.createTemplate)
payslipTemplateRoutes.put("/:id", controller.updateTemplate)
payslipTemplateRoutes.delete("/:id", controller.deleteTemplate)

export default payslipTemplateRoutes
