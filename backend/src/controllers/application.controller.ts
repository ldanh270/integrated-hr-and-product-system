import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { approveApplicationSchema, submitApplicationSchema } from "@/schemas/attendance.schema.ts"
import { ApiResponse } from "@/types"
import { IApplicationService } from "@/types/attendance.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

export class ApplicationController {
  constructor(private service: IApplicationService) {}

  submit = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.id as string
      const data = submitApplicationSchema.parse(req.body)
      const app = await this.service.submitApplication({ ...data, employeeId })
      res.status(HttpStatusCode.CREATED).json({ data: app, error: null })
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

  approve = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const processorId = req.user?.id as string
      const { status, rejectReason } = approveApplicationSchema.parse(req.body)

      const app = await this.service.processApplication(
        String(req.params.id),
        status,
        processorId,
        rejectReason,
      )
      res.status(HttpStatusCode.OK).json({ data: app, error: null })
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

  listEmployeeApplications = async (req: Request, res: Response<ApiResponse<any[]>>) => {
    const employeeId = req.params.employeeId || (req.user?.id as string)
    const apps = await this.service.getEmployeeApplications(employeeId)
    res.status(HttpStatusCode.OK).json({ data: apps, error: null })
  }

  getDetail = async (req: Request, res: Response<ApiResponse<any>>) => {
    const app = await this.service.getApplicationDetail(req.params.id)
    res.status(HttpStatusCode.OK).json({ data: app, error: null })
  }
}
