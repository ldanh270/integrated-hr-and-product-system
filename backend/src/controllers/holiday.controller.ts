import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createHolidaySchema,
  listHolidayQuerySchema,
  updateHolidaySchema,
} from "@/schemas/attendance.schema.ts"
import { ApiResponse } from "@/types"
import { IHolidayService } from "@/types/attendance.types.ts"

import { Request, Response } from "express"
import type { HolidayCalendar } from "@prisma/client"
import { z } from "zod"

/**
 * Controller for managing company and national holiday calendars.
 */
export class HolidayController {
  /**
   * Creates a new HolidayController instance.
   * @param service - The holiday service implementation.
   */
  constructor(private service: IHolidayService) {}

  /**
   * Lists holidays filtered by year or date range.
   * @param req - Request with optional year/startDate/endDate query params.
   * @param res - API response with matching holiday records.
   */
  list = async (req: Request, res: Response<ApiResponse<HolidayCalendar[]>>) => {
    const query = listHolidayQuerySchema.parse(req.query)
    const holidays = await this.service.listHolidays(query)

    res.status(HttpStatusCode.OK).json({ data: holidays, error: null })
  }

  /**
   * Creates a holiday entry for the attendance calendar.
   * @param req - Authenticated request with name, date, and type in body.
   * @param res - API response with the created holiday.
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<HolidayCalendar | null>>) => {
    try {
      const { name, date, type } = createHolidaySchema.parse(req.body)
      const createdById = req.user?.empId
      if (!createdById) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }
      const holiday = await this.service.createHoliday(name, date, type, createdById)
      res.status(HttpStatusCode.CREATED).json({ data: holiday, error: null })
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
   * Updates an existing holiday by ID.
   * @param req - Request with holiday ID in params and partial payload in body.
   * @param res - API response with the updated holiday.
   */
  update = async (req: Request<{ id: string }>, res: Response<ApiResponse<HolidayCalendar>>) => {
    const data = updateHolidaySchema.parse(req.body)
    const holiday = await this.service.updateHoliday(req.params.id, data)

    res.status(HttpStatusCode.OK).json({ data: holiday, error: null })
  }

  /**
   * Deletes a holiday by ID.
   * @param req - Request with holiday ID in params.
   * @param res - Empty API response on success.
   */
  delete = async (req: Request<{ id: string }>, res: Response<ApiResponse<null>>) => {
    await this.service.deleteHoliday(req.params.id)

    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  /**
   * Checks whether a given date is configured as a holiday.
   * @param req - Request with optional date query param (defaults to today).
   * @param res - API response with boolean flag.
   */
  checkHoliday = async (req: Request, res: Response<ApiResponse<boolean>>) => {
    const { date } = req.query
    const checkDate = date ? new Date(String(date)) : new Date()

    const isHoliday = await this.service.isHoliday(checkDate)
    res.status(HttpStatusCode.OK).json({ data: isHoliday, error: null })
  }
}
