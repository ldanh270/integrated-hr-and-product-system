import { HttpStatusCode } from "@/configs/http.config.ts"
/**
 * Middleware to authenticate requests using JWT
 * Validates the 'Authorization: Bearer <token>' header
 * Populates req.user if the token is valid, otherwise returns 401 Unauthorized
 */
import Employee from "@/entities/Employee.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import { NextFunction, Request, Response } from "express"

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
      status: "error",
      message: "Authorization header missing or invalid",
    })
    return
  }

  // Extract and verify token
  const token = authHeader.split(" ")[1]
  const decoded = JwtUtil.verifyToken(token)

  // Reject if verification fails
  if (!decoded) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      status: "error",
      message: "Token is invalid or expired",
    })
    return
  }

  // Verify that the user still exists in the database and is active
  try {
    const employee = await Employee.findById(decoded.empId).lean()
    if (!employee || employee.status !== "active") {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        status: "error",
        message: "User no longer exists or is inactive",
      })
      return
    }
  } catch (error) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      status: "error",
      message: "Invalid user token",
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
