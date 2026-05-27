import { AuthController } from "@/controllers/auth.controller.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { AuthService } from "@/services/auth.service.ts"

import express from "express"

const authRoutes = express.Router()

const service = new AuthService()
const controller = new AuthController(service)

// Login
authRoutes.post("/login", controller.login)

// Logout
authRoutes.post("/logout", authenticate, controller.logout as any)

export default authRoutes
