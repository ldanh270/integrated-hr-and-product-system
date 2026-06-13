import { ROLE } from "@/configs/entities/employee.config.ts"
import { AuthController } from "@/controllers/auth.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { authorizeRoles } from "@/middlewares/role.middleware.ts"
import { PrismaAuthRepository } from "@/repositories/auth.repository.ts"
import { AuthService } from "@/services/auth.service.ts"

import express from "express"

/**
 * authRoutes defines the API endpoints for authentication
 * Here we wire the concrete implementations together following the Dependency Injection pattern
 */
const authRoutes = express.Router()

// Instantiate the Repository (Data Access Layer)
const repository = new PrismaAuthRepository(prisma)

// Instantiate the Service and inject the Repository (Business Logic)
const service = new AuthService(repository)

// Instantiate the Controller and inject the Service (HTTP Adapter)
const controller = new AuthController(service)

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
authRoutes.post("/login", controller.login)

/**
 * @route POST /api/auth/logout
 * @desc Log user logout activity
 * @access Private (Requires valid token)
 */
authRoutes.post("/logout", authenticate, controller.logout as any)

/**
 * @route POST /api/auth/change-password
 * @desc Change password for authenticated user
 * @access Private (Requires valid token)
 */
authRoutes.post("/change-password", authenticate, controller.changePassword as any)

/**
 * @route POST /api/auth/forgot-password
 * @desc Request a password reset email
 * @access Public
 */
authRoutes.post("/forgot-password", controller.forgotPassword)

/**
 * @route POST /api/auth/validate-reset-token
 * @desc Validate a password reset token
 * @access Public
 */
authRoutes.post("/validate-reset-token", controller.validateResetToken)

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using a valid token
 * @access Public
 */
authRoutes.post("/reset-password", controller.resetPassword)

/**
 * @route GET /api/auth/activity-logs
 * @desc Get activity logs with filters
 * @access Private (Admin/HR/GM only)
 */
authRoutes.get(
  "/activity-logs",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.listActivityLogs as any,
)

/**
 * @route GET /api/auth/activity-logs/:id
 * @desc Get activity log detail
 * @access Private (Admin/HR/GM only)
 */
authRoutes.get(
  "/activity-logs/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER),
  controller.getActivityLogDetail as any,
)

export default authRoutes
