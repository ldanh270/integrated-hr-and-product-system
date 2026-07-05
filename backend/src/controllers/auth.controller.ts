import { HttpStatusCode, RESPONSE_STATUS } from "@/configs/system/http.config.ts"
import { AUTH_ERROR_MESSAGES } from "@/constants/auth.constants.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  activityLogQuerySchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  validateResetTokenSchema,
} from "@/schemas/auth.schema.ts"
import { IAuthService } from "@/types/auth.types.ts"
import { CookieUtil } from "@/utils/cookie.util.ts"

import { Request, Response } from "express"
import { z } from "zod"

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
      const { accessToken, refreshToken, refreshExpiresAt, ...authData } = result

      CookieUtil.setAccessToken(res, accessToken)
      CookieUtil.setRefreshToken(res, refreshToken, refreshExpiresAt)

      // Return successful response
      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: authData,
      })
    } catch (error: any) {
      // Handle validation errors (Zod) or business errors (AppError)
      const statusCode =
        error instanceof z.ZodError
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Login failed",
        errors: error instanceof z.ZodError ? error.issues : undefined,
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
          status: RESPONSE_STATUS.ERROR,
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
        })
      }

      // Delegate to service
      const rawRefreshToken = req.cookies?.["refresh_token"]
      const result = await this.service.logout(req.user.empId, rawRefreshToken, req.ip)

      CookieUtil.clearTokens(res)

      // Return successful response
      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: result.message,
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Logout failed",
      })
    }
  }

  /**
   * Refreshes the access token using a refresh token from cookies
   */
  refresh = async (req: Request, res: Response) => {
    try {
      const rawRefreshToken = req.cookies["refresh_token"]

      // DEBUG — xóa sau khi fix xong
      console.log("[REFRESH DEBUG] cookies received:", Object.keys(req.cookies))
      console.log("[REFRESH DEBUG] refresh_token present:", !!rawRefreshToken)
      console.log("[REFRESH DEBUG] refresh_token value (first 20 chars):", rawRefreshToken?.slice(0, 20))

      if (!rawRefreshToken) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: RESPONSE_STATUS.ERROR,
          message: "No refresh token provided",
        })
      }

      const result = await this.service.refresh(rawRefreshToken)
      const { accessToken, refreshToken, refreshExpiresAt, ...authData } = result

      CookieUtil.setAccessToken(res, accessToken)
      CookieUtil.setRefreshToken(res, refreshToken, refreshExpiresAt)

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: authData,
      })
    } catch (error: any) {
      console.log("[REFRESH DEBUG] error:", error.message)
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Refresh failed",
      })
    }
  }

  /**
   * Gets the currently authenticated user's information
   */
  getMe = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: RESPONSE_STATUS.ERROR,
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
        })
      }

      const result = await this.service.getMe(req.user.empId)

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: result,
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Failed to get user details",
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
        status: RESPONSE_STATUS.SUCCESS,
        message: result.message,
      })
    } catch (error: any) {
      const statusCode =
        error instanceof z.ZodError
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Action failed",
        errors: error instanceof z.ZodError ? error.issues : undefined,
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
          status: RESPONSE_STATUS.ERROR,
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
        })
      }

      const validatedData = changePasswordSchema.parse(req.body)
      const result = await this.service.changePassword(req.user.empId, validatedData)

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: result.message,
      })
    } catch (error: any) {
      const statusCode =
        error instanceof z.ZodError
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Action failed",
        errors: error instanceof z.ZodError ? error.issues : undefined,
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
          status: RESPONSE_STATUS.ERROR,
          message: result.message || "Invalid token",
        })
      }

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: result,
      })
    } catch (error: any) {
      const statusCode =
        error instanceof z.ZodError
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Action failed",
        errors: error instanceof z.ZodError ? error.issues : undefined,
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
        status: RESPONSE_STATUS.SUCCESS,
        message: result.message,
      })
    } catch (error: any) {
      const statusCode =
        error instanceof z.ZodError
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Action failed",
        errors: error instanceof z.ZodError ? error.issues : undefined,
      })
    }
  }

  /**
   * Lists activity logs for the authenticated user (Personal History)
   */
  listMyActivityLogs = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: RESPONSE_STATUS.ERROR,
          message: "Unauthorized",
        })
      }

      // Validate request query using shared activity log schema
      const validatedQuery = activityLogQuerySchema.parse(req.query)

      // Delegate to service with empId from token
      const result = await this.service.getMyActivityLogs(req.user.empId, validatedQuery)

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: result,
      })
    } catch (error: any) {
      const statusCode =
        error instanceof z.ZodError
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Failed to fetch personal activity logs",
        errors: error instanceof z.ZodError ? error.issues : undefined,
      })
    }
  }

  getMyActivityLogDetail = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: RESPONSE_STATUS.ERROR,
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
        })
      }

      const result = await this.service.getMyActivityLogDetail(
        req.user.empId,
        String(req.params.id),
      )

      if (!result) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          status: RESPONSE_STATUS.ERROR,
          message: "Activity log not found",
        })
      }

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: result,
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Failed to fetch personal activity log detail",
      })
    }
  }

  /**
   * Lists activity logs with filters
   */
  listActivityLogs = async (req: AuthRequest, res: Response) => {
    try {
      const validatedQuery = activityLogQuerySchema.parse(req.query)
      const result = await this.service.getActivityLogs(validatedQuery)

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: result,
      })
    } catch (error: any) {
      const statusCode =
        error instanceof z.ZodError
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Failed to fetch activity logs",
        errors: error instanceof z.ZodError ? error.issues : undefined,
      })
    }
  }

  /**
   * Gets a single activity log detail
   */
  getActivityLogDetail = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.service.getActivityLogDetail(String(req.params.id))

      if (!result) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          status: RESPONSE_STATUS.ERROR,
          message: "Activity log not found",
        })
      }

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: result,
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Failed to fetch activity log detail",
      })
    }
  }
}
