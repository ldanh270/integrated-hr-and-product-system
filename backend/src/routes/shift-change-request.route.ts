import { ShiftChangeRequestController } from "@/controllers/shift-change-request.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaShiftChangeRequestRepository } from "@/repositories/shift-change-request.repository.ts"
import { ShiftChangeRequestService } from "@/services/shift-change-request.service.ts"

import express from "express"

const shiftChangeRequestRoutes = express.Router()

const repository = new PrismaShiftChangeRequestRepository(prisma)
const service = new ShiftChangeRequestService(repository)
const controller = new ShiftChangeRequestController(service)

shiftChangeRequestRoutes.use(authenticate)

// Employee: submit a shift change request
shiftChangeRequestRoutes.post("/", controller.submit)

// Employee: view own shift change requests
shiftChangeRequestRoutes.get("/mine", controller.listMine)

export default shiftChangeRequestRoutes
