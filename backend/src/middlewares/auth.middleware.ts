/**
 * Middleware to authenticate requests using JWT
 * Validates the 'Authorization: Bearer <token>' header
 * Populates req.user if the token is valid, otherwise returns 401 Unauthorized
 */
import { AUTH_ERRORS } from "@/configs/auth/auth.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import { NextFunction, Request, Response } from "express"

const employeeRepository = new PrismaEmployeeRepository(prisma)

/**
 * Interface extending the Express Request to include the authenticated user's information.
 * role is intentionally absent — all authorization decisions go through dynamic RBAC.
 */
export interface AuthRequest extends Request {
  user?: {
    empId: string
    username: string
  }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.["access_token"]

  // Verify token presence
  if (!token) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      data: null,
      error: AUTH_ERRORS.MISSING_TOKEN,
    })
    return
  }

  // Verify token
  const decoded = JwtUtil.verifyAccessToken(token)

  // Reject if verification fails
  if (!decoded) {
    console.error("Auth Middleware: Token verification failed or token expired")
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      data: null,
      error: AUTH_ERRORS.TOKEN_EXPIRED,
    })
    return
  }

  // Token version verification — D2.6 requires version 3+ (hard cutover)
  if (!decoded.version || decoded.version < 3) {
    console.error("Auth Middleware: Token version outdated — D2.6 requires v3+")
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      data: null,
      error: { message: "Session expired. Please login again.", code: "TOKEN_OUTDATED" },
    })
    return
  }

  // Verify that the user still exists in the database and is active
  try {
    const employee = await employeeRepository.findById(decoded.empId)
    if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      console.error("Auth Middleware: Employee not found or inactive", {
        empId: decoded.empId,
        employeeStatus: employee?.status,
      })
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: AUTH_ERRORS.ACCOUNT_INACTIVE,
      })
      return
    }
  } catch (error) {
    console.error("Auth Middleware: Error finding employee", error)
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      data: null,
      error: AUTH_ERRORS.AUTH_ERROR,
    })
    return
  }

  // Attach decoded user info to the request object for use in controllers
  req.user = {
    empId: decoded.empId,
    username: decoded.username,
  }

  next()
}
