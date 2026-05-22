import { AuthController } from "@/controllers/auth.controller.ts"
import { AuthService } from "@/services/auth.service.ts"

import express from "express"

const authRoutes = express.Router()

const service = new AuthService()
const controller = new AuthController(service)

// Signup
authRoutes.post("/signup", controller.signup)

export default authRoutes
