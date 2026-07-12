import { ErrorCode, ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  listApplicationsQuerySchema,
  submitBatchApplicationSchema,
} from "@/schemas/attendance.schema.ts"
import { ApiResponse } from "@/types"
import { IApplicationBatchService } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { Request, Response } from "express"
import { z} from "zod"

export class ApplicationBatchController {
  constructor(private service: IApplicationBatchService) {}

  /**
   * Submits a batch of applications  (same type) for the authenticated employee.
   *
   * @param req - Authenticated request with batch payload.
   * @param res - Response with created batch.
   */
  submitBatch = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)
      }

      const data = submitBatchApplicationSchema.parse(req.body)
      const batch = await this.service.submitBatch({ ...data, employeeId })
      res.status(HttpStatusCode.CREATED).json({ data: batch, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Retrieves a specific batch by its unique identifier.
   *
   * @param req - Authenticated request with batch ID param.
   * @param res - Response with batch details.
   */
  getById = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    const batch = await this.service.getBatchById(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: batch, error: null })
  }

  /**
   * Lists batches belonging to the authenticated employee.
   *
   * @param req - Authenticated request with query params.
   * @param res - Response with paginated batches.
   */
  listMine = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)
      }

      const query = listApplicationsQuerySchema.parse(req.query)
      const result = await this.service.listMyBatches(employeeId, query)
      res.status(HttpStatusCode.OK).json({
        data: result.data,
        error: null,
        meta: {
          total: result.total,
          page: query.page,
          limit: query.pageSize,
          totalPages: Math.ceil(result.total / query.pageSize),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Invalid query parameters", code: ErrorCode.VALIDATION_ERROR, meta: error.issues },
        })
      }
      throw error
    }
  }

  /**
   * Lists all batches (manager/HR view).
   *
   * @param req - Authenticated request with query params.
   * @param res - Response with paginated batches.
   */
  listAll = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      const query = listApplicationsQuerySchema.parse(req.query)
      const result = await this.service.listAllBatches(query, req.user)
      res.status(HttpStatusCode.OK).json({
        data: result.data,
        error: null,
        meta: {
          total: result.total,
          page: query.page,
          limit: query.pageSize,
          totalPages: Math.ceil(result.total / query.pageSize),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Invalid query parameters", code: ErrorCode.VALIDATION_ERROR, meta: error.issues },
        })
      }
      throw error
    }
  }

  /**
   * Cancels all pending sub-applications within a batch.
   * Only the batch owner can cancel.
   *
   * @param req - Authenticated request with batch ID param.
   * @param res - Response with updated batch.
   */
  cancelBatch = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)
      }

      const batch = await this.service.cancelBatch(String(req.params.id), employeeId)
      res.status(HttpStatusCode.OK).json({ data: batch, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: ErrorCode.VALIDATION_ERROR, meta: error.issues },
        })
      }
      throw error
    }
  }
}
