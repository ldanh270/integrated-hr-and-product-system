import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { assignShiftScheduleSchema, overrideEmployeeShiftSchema } from "@/schemas/shift.schema.ts"
import { ApiResponse } from "@/types"
import { IScheduleService } from "@/types/shift.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

/**
 * Controller for handling schedule-related requests.
 */
export class ScheduleController {
  /**
   * Creates a new ScheduleController instance.
   * @param service - The schedule service implementation.
   */
  constructor(private service: IScheduleService) {}

  /**
   * Assigns a shift schedule to an employee or a group of employees.
   * @param req - Authenticated request with schedule data in body.
   * @param res - API response with the created schedule.
   */
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
   * Gets the schedule for the authenticated employee for a specific date or today.
   * @param req - Authenticated request.
   * @param res - API response with the employee's schedule.
   */
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

  /**
   * Lists all schedules for the authenticated employee.
   * @param req - Authenticated request.
   * @param res - API response with a list of schedules.
   */
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

  getEmployeeScheduleById = async (
    req: Request<{ employeeId: string }>,
    res: Response<ApiResponse<any>>,
  ) => {
    const { employeeId } = req.params
    const dateQuery = req.query.date as string | undefined
    const scheduleDate = dateQuery ? new Date(dateQuery) : new Date()

    const schedule = await this.service.getScheduleForEmployee(employeeId, scheduleDate)
    res.status(HttpStatusCode.OK).json({ data: schedule, error: null })
  }

  listEmployeeSchedulesById = async (
    req: Request<{ employeeId: string }>,
    res: Response<ApiResponse<any[]>>,
  ) => {
    const { employeeId } = req.params
    const schedules = await this.service.listSchedulesForEmployee(employeeId)

    res.status(HttpStatusCode.OK).json({ data: schedules, error: null })
  }

  /**
   * Overrides an employee's shift for a specific date.
   * @param req - Authenticated request with override data in body.
   * @param res - API response with the created override.
   */
  overrideShift = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const data = overrideEmployeeShiftSchema.parse(req.body)
      const override = await this.service.overrideEmployeeShift(data)
      res.status(HttpStatusCode.CREATED).json({ data: override, error: null })
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
}
