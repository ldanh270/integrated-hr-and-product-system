import { PayslipTemplateController } from "@/controllers/payslip-template.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaPayslipTemplateRepository } from "@/repositories/payslip-template.repository.ts"
import { PayslipTemplateService } from "@/services/payslip-template.service.ts"

import express from "express"

const payslipTemplateRoutes = express.Router()

const repo = new PrismaPayslipTemplateRepository(prisma)
const service = new PayslipTemplateService(repo)
const controller = new PayslipTemplateController(service)

payslipTemplateRoutes.use(authenticate)
payslipTemplateRoutes.use(requirePermission("payroll.read"))

payslipTemplateRoutes.get("/", controller.listTemplates)
payslipTemplateRoutes.post("/", requirePermission("payroll.create"), controller.createTemplate)
payslipTemplateRoutes.put("/:id", requirePermission("payroll.update"), controller.updateTemplate)
payslipTemplateRoutes.delete("/:id", requirePermission("payroll.delete"), controller.deleteTemplate)

export default payslipTemplateRoutes
