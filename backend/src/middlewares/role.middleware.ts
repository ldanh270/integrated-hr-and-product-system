import { HttpStatusCode } from "@/configs/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"

import { NextFunction, Response } from "express"

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(HttpStatusCode.FORBIDDEN).json({
        status: "error",
        message: "You do not have permission to perform this action",
      })
    }
    next()
  }
}
