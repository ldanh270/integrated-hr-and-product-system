import { ErrorMessage } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode, RESPONSE_STATUS } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { IAuthService } from "@/types/auth.types.ts"

import { Response } from "express"

/**
 * SecurityController handles security monitoring and account management requests
 */
export class SecurityController {
  constructor(private authService: IAuthService) {}

  /**
   * Gets security dashboard summary
   */
  getSummary = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.authService.getSecuritySummary()

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: result,
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Failed to fetch security summary",
      })
    }
  }

  /**
   * Gets all currently locked accounts
   */
  getLockedAccounts = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.authService.getLockedAccounts()

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        data: result,
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Failed to fetch locked accounts",
      })
    }
  }

  /**
   * Unlocks an employee account
   */
  unlockAccount = async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId } = req.params
      const actorId = req.user?.empId

      if (!actorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: RESPONSE_STATUS.ERROR,
          message: ErrorMessage.UNAUTHORIZED,
        })
      }

      await this.authService.unlockAccount(String(employeeId), actorId, req.ip)

      res.status(HttpStatusCode.OK).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Account unlocked successfully",
      })
    } catch (error: any) {
      res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: RESPONSE_STATUS.ERROR,
        message: error.message || "Failed to unlock account",
      })
    }
  }
}
