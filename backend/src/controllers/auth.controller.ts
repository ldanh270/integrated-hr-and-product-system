import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { loginSchema } from "@/schemas/auth.schema.ts"
import { IAuthService } from "@/types/auth.types.ts"

import { Request, Response } from "express"

/**
 * AuthController handles HTTP requests related to authentication
 * It acts as an adapter between the HTTP layer and the AuthService business logic
 */
export class AuthController {
  /**
   * Injecting IAuthService abstraction (Dependency Injection)
   */
  constructor(private service: IAuthService) {}

  /**
   * Handles the login request: validates input and delegates to the service
   */
  login = async (req: Request, res: Response) => {
    try {
      // 1. Validate request body using Zod schema
      const validatedData = loginSchema.parse(req.body)

      // 2. Delegate to service
      const result = await this.service.login(validatedData, req.ip)

      // 3. Return successful response
      res.status(HttpStatusCode.OK).json({
        status: "success",
        data: result,
      })
    } catch (error: any) {
      // 4. Handle validation errors (Zod) or business errors (AppError)
      const statusCode =
        error.name === "ZodError"
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: "error",
        message: error.message || "Login failed",
        errors: error.errors, // Include Zod validation details if present
      })
    }
  }

  /**
   * Handles the logout request: extracts user info from AuthRequest and delegates to service
   */
  logout = async (req: AuthRequest, res: Response) => {
    try {
      // Security guard: req.user should be populated by authenticate middleware
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: "error",
          message: "Unauthorized",
        })
      }

      // 1. Delegate to service
      const result = await this.service.logout(req.user.empId, req.ip)

      // 2. Return successful response
      res.status(HttpStatusCode.OK).json({
        status: "success",
        message: result.message,
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || "Logout failed",
      })
    }
  }
}
