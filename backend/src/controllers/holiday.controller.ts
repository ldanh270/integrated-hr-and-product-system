import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { createHolidaySchema } from "@/schemas/attendance.schema.ts"
import { ApiResponse } from "@/types"
import { IHolidayService } from "@/types/attendance.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

export class HolidayController {
  constructor(private service: IHolidayService) {}

  create = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const { name, date, type } = createHolidaySchema.parse(req.body)
      const holiday = await this.service.createHoliday(name, date, type)
      res.status(HttpStatusCode.CREATED).json({ data: holiday, error: null })
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

  checkHoliday = async (req: Request, res: Response<ApiResponse<boolean>>) => {
    const { date } = req.query
    const checkDate = date ? new Date(String(date)) : new Date()

    const isHoliday = await this.service.isHoliday(checkDate)
    res.status(HttpStatusCode.OK).json({ data: isHoliday, error: null })
  }
}
