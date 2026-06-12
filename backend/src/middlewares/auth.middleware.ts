/**
 * Middleware to authenticate requests using JWT
 * Validates the 'Authorization: Bearer <token>' header
 * Populates req.user if the token is valid, otherwise returns 401 Unauthorized
 */
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import { NextFunction, Request, Response } from "express"

const employeeRepository = new PrismaEmployeeRepository(prisma)

/**
 * Interface extending the Express Request to include the authenticated user's information
 * This allows subsequent handlers to access the user context
 */
export interface AuthRequest extends Request {
  user?: {
    empId: string
    email: string
    role: string
  }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  // Verify Authorization header presence and format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      data: null,
      error: { message: "Authorization header missing or invalid", code: "UNAUTHORIZED" },
    })
    return
  }

  // Extract and verify token
  const token = authHeader.split(" ")[1]
  const decoded = JwtUtil.verifyToken(token)

  // Reject if verification fails
  if (!decoded) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      data: null,
      error: { message: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.", code: "TOKEN_EXPIRED" },
    })
    return
  }

  // Verify that the user still exists in the database and is active
  try {
    const employee = await employeeRepository.findById(decoded.empId)
    if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Tài khoản không tồn tại hoặc không còn hoạt động.", code: "ACCOUNT_INACTIVE" },
      })
      return
    }
  } catch (error) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      data: null,
      error: { message: "Không thể xác thực người dùng.", code: "AUTH_ERROR" },
    })
    return
  }

  // Attach decoded user info to the request object for use in controllers
  req.user = {
    empId: decoded.empId,
    email: decoded.email,
    role: decoded.role,
  }

  next()
}
