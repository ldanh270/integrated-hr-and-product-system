import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { submitShiftChangeRequestSchema } from "@/schemas/shift.schema.ts"
import { ApiResponse } from "@/types"
import { IShiftChangeRequestService } from "@/types/shift.types.ts"

import { Response } from "express"
import { z } from "zod"

/**
 * Controller for handling shift change requests.
 */
export class ShiftChangeRequestController {
  /**
   * Creates a new ShiftChangeRequestController instance.
   * @param service - The shift change request service implementation.
   */
  constructor(private service: IShiftChangeRequestService) {}

  /**
   * Submits a new shift change request.
   * @param req - Authenticated request with request data in body.
   * @param res - API response with the created request.
   */
  submit = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const body = submitShiftChangeRequestSchema.parse(req.body)
      const result = await this.service.submitRequest({ ...body, employeeId })
      res.status(HttpStatusCode.CREATED).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }

  /**
   * Lists shift change requests submitted by the authenticated employee.
   * @param req - Authenticated request.
   * @param res - API response with a list of requests.
   */
  listMine = async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }
    const requests = await this.service.getMyRequests(employeeId)
    res.status(HttpStatusCode.OK).json({ data: requests, error: null })
  }
}
