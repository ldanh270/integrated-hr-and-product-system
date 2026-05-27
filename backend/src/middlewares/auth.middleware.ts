import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import { NextFunction, Request, Response } from "express"

export interface AuthRequest extends Request {
  user?: {
    empId: string
    email: string
    role: string
  }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      status: "error",
      message: "Authorization header missing or invalid",
    })
  }

  const token = authHeader.split(" ")[1]
  const decoded = JwtUtil.verifyToken(token)

  if (!decoded) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      status: "error",
      message: "Token is invalid or expired",
    })
  }

  req.user = {
    empId: decoded.empId,
    email: decoded.email,
    role: decoded.role,
  }

  next()
}
