import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import {
  submitApplicationSchema,
  approveApplicationSchema,
} from "@/schemas/attendance.schema.ts"
import { IApplicationService } from "@/types/attendance.types.ts"
import { ApiResponse } from "@/types"
import { Request, Response } from "express"
import { z } from "zod"

export class ApplicationController {
  constructor(private service: IApplicationService) {}

  submit = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const { employeeId } = req.body
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
      // In a real app, processorId comes from req.user
      const { processorId } = req.body
      const { status } = approveApplicationSchema.parse(req.body)
      
      const app = await this.service.processApplication(String(req.params.id), status, processorId)
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
    const apps = await this.service.getEmployeeApplications(String(req.params.employeeId))
    res.status(HttpStatusCode.OK).json({ data: apps, error: null })
  }
}
