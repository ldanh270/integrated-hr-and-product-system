import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { assignShiftScheduleSchema, overrideEmployeeShiftSchema } from "@/schemas/shift.schema.ts"
import { ApiResponse } from "@/types"
import { IScheduleService } from "@/types/shift.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

export class ScheduleController {
  constructor(private service: IScheduleService) {}

  assignSchedule = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const reqData = assignShiftScheduleSchema.parse(req.body)
      const data = { ...reqData, createdById: req.user?.empId || "system" }
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

  getEmployeeSchedule = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }
    const dateQuery = req.query.date as string | undefined
    const scheduleDate = dateQuery ? new Date(dateQuery) : new Date()

    const schedule = await this.service.getScheduleForEmployee(employeeId, scheduleDate)
    res.status(HttpStatusCode.OK).json({ data: schedule, error: null })
  }

  listEmployeeSchedules = async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }
    const schedules = await this.service.listSchedulesForEmployee(employeeId)
    res.status(HttpStatusCode.OK).json({ data: schedules, error: null })
  }

  overrideShift = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
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
