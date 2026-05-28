import { HttpStatusCode } from "@/configs/constants/http.config.ts"
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

/**
 * Middleware to authenticate requests using JWT
 * Validates the 'Authorization: Bearer <token>' header
 * Populates req.user if the token is valid, otherwise returns 401 Unauthorized
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  // Verify Authorization header presence and format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      status: "error",
      message: "Authorization header missing or invalid",
    })
  }

  // Extract and verify token
  const token = authHeader.split(" ")[1]
  const decoded = JwtUtil.verifyToken(token)

  // Reject if verification fails
  if (!decoded) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      status: "error",
      message: "Token is invalid or expired",
    })
  }

  // Attach decoded user info to the request object for use in controllers
  req.user = {
    empId: decoded.empId,
    email: decoded.email,
    role: decoded.role,
  }

  next()
}
