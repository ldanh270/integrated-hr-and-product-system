import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { AuthService } from "@/services/auth.service.ts"

import { Response } from "express"

export class AuthController {
  constructor(private service: AuthService) {}

  login = async (req: any, res: Response) => {
    try {
      const result = await this.service.login(req.body, req.ip)
      res.status(HttpStatusCode.OK).json({
        status: "success",
        data: result,
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || "Login failed",
      })
    }
  }

  logout = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: "error",
          message: "Unauthorized",
        })
      }

      const result = await this.service.logout(req.user.empId, req.ip)
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
