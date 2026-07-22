/**
 * HTTP boundary for project and cross-project capacity forecasts.
 * It validates transport input and delegates all forecast decisions to the service layer.
 */
import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  forecastCapacityBoardQuerySchema,
  forecastProjectCapacitySchema,
} from "@/schemas/capacity-copilot.schema.ts"
import {
  CapacityBoardForecastResult,
  CapacityCopilotService,
} from "@/services/capacity-copilot.service.ts"
import { ApiResponse } from "@/types"
import { CapacityForecastResult } from "@/utils/project-capacity-copilot.util.ts"

import { Response } from "express"

export class CapacityCopilotController {
  constructor(private service: CapacityCopilotService) {}

  /**
   * Returns the project-level board forecast for a selected week.
   * The service may reuse snapshots refreshed by availability update jobs.
   */
  forecastCapacityBoard = async (
    req: AuthRequest,
    res: Response<ApiResponse<CapacityBoardForecastResult>>,
  ) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    const query = forecastCapacityBoardQuerySchema.parse(req.query)
    const forecast = await this.service.forecastCapacityBoard(query)

    return res.status(HttpStatusCode.OK).json({
      data: forecast,
      error: null,
    })
  }

  /**
   * Forecasts weekly delivery capacity for a project.
   * This is advisory only: Admin/PM still decides staffing changes.
   */
  forecastProjectCapacity = async (
    req: AuthRequest,
    res: Response<ApiResponse<CapacityForecastResult>>,
  ) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    const projectId = String(req.params.projectId)
    const body = forecastProjectCapacitySchema.parse(req.body)
    const forecast = await this.service.forecastProjectCapacity(projectId, body)

    return res.status(HttpStatusCode.OK).json({
      data: forecast,
      error: null,
    })
  }
}
