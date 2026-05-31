import { ApprovalController } from "@/controllers/approval.controller.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { ApprovalService } from "@/services/approval/approval.service.ts"

import express from "express"

const approvalRoutes = express.Router()

const service = new ApprovalService()
const controller = new ApprovalController(service)

approvalRoutes.use(authenticate)

approvalRoutes.get("/", controller.listPending)
approvalRoutes.patch("/:category/:id", controller.process)

export default approvalRoutes
