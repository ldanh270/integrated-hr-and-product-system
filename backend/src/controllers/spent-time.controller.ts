import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createSpentTimeSchema,
  spentTimeQuerySchema,
  updateSpentTimeSchema,
} from "@/schemas/spent-time.schema.ts"
import { ApiResponse, ISpentTimeService, SpentTime } from "@/types"
import { Response } from "express"
import { z } from "zod"

export class SpentTimeController {
  constructor(private service: ISpentTimeService) {}

  /**
   * List spent time logs (with optional filtering)
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<SpentTime[]>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const queryParams = { ...req.query } as any
      if (req.params.taskId) {
        queryParams.taskId = req.params.taskId
      }

      const query = spentTimeQuerySchema.parse(queryParams)
      const result = await this.service.listSpentTimes(query, req.user.empId, req.user.role)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
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
   * Get a single spent time log by ID
   */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<SpentTime>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    const spentTime = await this.service.getSpentTime(String(req.params.id), req.user.empId, req.user.role)
    if (!spentTime) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Spent time log not found", code: "NOT_FOUND" },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: spentTime, error: null })
  }

  /**
   * Create a spent time log
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<SpentTime>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const body = { ...req.body }
      if (req.params.taskId) {
        body.taskId = req.params.taskId
      }

      const data = createSpentTimeSchema.parse(body)
      const spentTime = await this.service.createSpentTime(data, req.user.empId, req.user.role)
      res.status(HttpStatusCode.CREATED).json({ data: spentTime, error: null })
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
   * Update a spent time log
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<SpentTime>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const data = updateSpentTimeSchema.parse(req.body)
      const spentTime = await this.service.updateSpentTime(
        String(req.params.id),
        data,
        req.user.empId,
        req.user.role,
      )
      if (!spentTime) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Spent time log not found", code: "NOT_FOUND" },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: spentTime, error: null })
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
   * Delete a spent time log
   */
  delete = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    await this.service.deleteSpentTime(String(req.params.id), req.user.empId, req.user.role)
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }
}
