import { AuthController } from "@/controllers/auth.controller.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { MongoAuthRepository } from "@/repositories/auth.repository.ts"
import { AuthService } from "@/services/auth.service.ts"

import express from "express"

/**
 * authRoutes defines the API endpoints for authentication
 * Here we wire the concrete implementations together following the Dependency Injection pattern
 */
const authRoutes = express.Router()

// 1. Instantiate the Repository (Data Access)
const repository = new MongoAuthRepository()

// 2. Instantiate the Service and inject the Repository (Business Logic)
const service = new AuthService(repository)

// 3. Instantiate the Controller and inject the Service (HTTP Adapter)
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

export default authRoutes
