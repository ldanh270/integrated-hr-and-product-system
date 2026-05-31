import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { processApprovalSchema } from "@/schemas/approval.schema.ts"
import { IApprovalService } from "@/types/approval.types.ts"
import { ApiResponse } from "@/types"
import { Request, Response } from "express"
import { z } from "zod"
import { RequestCategory } from "@/configs/constants/approval.config.ts"

export class ApprovalController {
  constructor(private service: IApprovalService) {}

  /**
   * List all pending approvals that the current authenticated user can approve
   */
  listPending = async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const { empId, role } = req.user
      const approvals = await this.service.getPendingApprovals(empId, role)

      res.status(HttpStatusCode.OK).json({
        data: approvals,
        error: null,
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Process (approve or reject) a specific request
   */
  process = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const { empId } = req.user
      const { category, id } = req.params

      // Validate query / params
      const parsedBody = processApprovalSchema.parse(req.body)

      const result = await this.service.processApproval({
        id: String(id),
        category: category as RequestCategory,
        status: parsedBody.status,
        processorId: empId,
        rejectReason: parsedBody.rejectReason,
      })

      res.status(HttpStatusCode.OK).json({
        data: result,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: "VALIDATION_ERROR",
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }
}
