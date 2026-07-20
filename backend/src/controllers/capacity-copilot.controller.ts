import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
/**
 * HTTP controller for the Part-time Capacity Copilot forecast flow.
 */
import { forecastProjectCapacitySchema } from "@/schemas/capacity-copilot.schema.ts"
import { CapacityCopilotService } from "@/services/capacity-copilot.service.ts"
import { ApiResponse } from "@/types"
import { CapacityForecastResult } from "@/utils/project-capacity-copilot.util.ts"

import { Response } from "express"

export class CapacityCopilotController {
  constructor(private service: CapacityCopilotService) {}

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
