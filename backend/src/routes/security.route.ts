import { ROLE } from "@/configs/entities/employee.config.ts"
import { SecurityController } from "@/controllers/security.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaAuthRepository } from "@/repositories/auth.repository.ts"
import { AuthService } from "@/services/auth.service.ts"

import express from "express"

/**
 * securityRoutes defines the API endpoints for security monitoring and management
 */
const securityRoutes = express.Router()

// Reuse AuthRepository and AuthService
const repository = new PrismaAuthRepository(prisma)
const authService = new AuthService(repository)

const controller = new SecurityController(authService)

// All routes require authentication
securityRoutes.use(authenticate)

/**
 * @route GET /api/security/dashboard
 * @desc Get security summary for dashboard
 * @access Private (Admin/GM/HR only)
 */
securityRoutes.get(
  "/dashboard",
  authorizeRoles(ROLE.ADMIN, ROLE.GENERAL_MANAGER, ROLE.HR_MANAGER),
  controller.getSummary as any
)

/**
 * @route GET /api/security/locked-accounts
 * @desc Get all currently locked accounts
 * @access Private (Admin/GM/HR only)
 */
securityRoutes.get(
  "/locked-accounts",
  authorizeRoles(ROLE.ADMIN, ROLE.GENERAL_MANAGER, ROLE.HR_MANAGER),
  controller.getLockedAccounts as any
)

/**
 * @route PATCH /api/security/unlock/:employeeId
 * @desc Unlock an employee account
 * @access Private (Admin/GM/HR only)
 */
securityRoutes.patch(
  "/unlock/:employeeId",
  authorizeRoles(ROLE.ADMIN, ROLE.GENERAL_MANAGER, ROLE.HR_MANAGER),
  controller.unlockAccount as any
)

export default securityRoutes
