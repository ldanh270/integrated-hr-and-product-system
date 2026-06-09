import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  validateResetTokenSchema,
} from "@/schemas/auth.schema.ts"
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
      // Validate request body using Zod schema
      const validatedData = loginSchema.parse(req.body)

      // Delegate to service
      const result = await this.service.login(validatedData, req.ip)

      // Return successful response
      res.status(HttpStatusCode.OK).json({
        status: "success",
        data: result,
      })
    } catch (error: any) {
      // Handle validation errors (Zod) or business errors (AppError)
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

      // Delegate to service
      const result = await this.service.logout(req.user.empId, req.ip)

      // Return successful response
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

  /**
   * Handles the forgot password request
   */
  forgotPassword = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = forgotPasswordSchema.parse(req.body)

      // Delegate to service
      const result = await this.service.forgotPassword(validatedData)

      // Return successful response
      res.status(HttpStatusCode.OK).json({
        status: "success",
        message: result.message,
      })
    } catch (error: any) {
      const statusCode =
        error.name === "ZodError"
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: "error",
        message: error.message || "Request failed",
        errors: error.errors,
      })
    }
  }

  /**
   * Handles password change for authenticated users
   */
  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: "error",
          message: "Unauthorized",
        })
      }

      const validatedData = changePasswordSchema.parse(req.body)
      const result = await this.service.changePassword(req.user.empId, validatedData)

      res.status(HttpStatusCode.OK).json({
        status: "success",
        message: result.message,
      })
    } catch (error: any) {
      const statusCode =
        error.name === "ZodError"
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: "error",
        message: error.message || "Password change failed",
        errors: error.errors,
      })
    }
  }

  /**
   * Validates a password reset token
   */
  validateResetToken = async (req: Request, res: Response) => {
    try {
      const validatedData = validateResetTokenSchema.parse(req.body)
      const result = await this.service.validateResetToken(validatedData)

      if (!result.isValid) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          status: "error",
          message: result.message || "Invalid token",
        })
      }

      res.status(HttpStatusCode.OK).json({
        status: "success",
        data: result,
      })
    } catch (error: any) {
      const statusCode =
        error.name === "ZodError"
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: "error",
        message: error.message || "Token validation failed",
        errors: error.errors,
      })
    }
  }

  /**
   * Handles password reset using a token
   */
  resetPassword = async (req: Request, res: Response) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body)
      const result = await this.service.resetPassword(validatedData)

      res.status(HttpStatusCode.OK).json({
        status: "success",
        message: result.message,
      })
    } catch (error: any) {
      const statusCode =
        error.name === "ZodError"
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: "error",
        message: error.message || "Password reset failed",
        errors: error.errors,
      })
    }
  }
}
