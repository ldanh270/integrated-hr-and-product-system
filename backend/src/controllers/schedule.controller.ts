import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { assignShiftScheduleSchema, overrideEmployeeShiftSchema } from "@/schemas/shift.schema.ts"
import { ApiResponse } from "@/types"
import { IScheduleService } from "@/types/shift.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

export class ScheduleController {
  constructor(private service: IScheduleService) {}

  assignSchedule = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const data = assignShiftScheduleSchema.parse(req.body)
      const schedule = await this.service.assignSchedule(data)
      res.status(HttpStatusCode.CREATED).json({ data: schedule, error: null })
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

  getEmployeeSchedule = async (req: Request, res: Response<ApiResponse<any>>) => {
    const { employeeId } = req.params
    const dateQuery = req.query.date as string | undefined
    const scheduleDate = dateQuery ? new Date(dateQuery) : new Date()

    const schedule = await this.service.getScheduleForEmployee(String(employeeId), scheduleDate)
    res.status(HttpStatusCode.OK).json({ data: schedule, error: null })
  }

  overrideShift = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const data = overrideEmployeeShiftSchema.parse(req.body)
      const override = await this.service.overrideEmployeeShift(data)
      res.status(HttpStatusCode.CREATED).json({ data: override, error: null })
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
}
