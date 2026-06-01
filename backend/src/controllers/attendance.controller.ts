import { HttpStatusCode } from "@/configs/http.config.ts"
import {
  attendanceRecordQuerySchema,
  checkInSchema,
  checkOutSchema,
} from "@/schemas/attendance.schema.ts"
import { ApiResponse } from "@/types"
import { IAttendanceService } from "@/types/attendance.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

export class AttendanceController {
  constructor(private service: IAttendanceService) {}

  checkIn = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      // In a real app, employeeId comes from req.user!
      // Here we assume it's passed in body or req.user.id
      const { employeeId } = req.body
      const { location } = checkInSchema.parse(req.body)

      const record = await this.service.checkIn(employeeId, location)
      res.status(HttpStatusCode.OK).json({ data: record, error: null })
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

  checkOut = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const { employeeId } = req.body
      const { location } = checkOutSchema.parse(req.body)

      const record = await this.service.checkOut(employeeId, location)
      res.status(HttpStatusCode.OK).json({ data: record, error: null })
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

  scan = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      // Auto-detect Check In vs Check Out based on existing record
      // In a real app employeeId comes from req.user
      const { employeeId } = req.body
      const { location } = checkInSchema.parse(req.body)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const records = await this.service.getAttendanceRecords({
        employeeId,
        startDate: today.toISOString(),
        endDate: today.toISOString(),
      })
      const todayRecord = records[0]

      let result
      if (!todayRecord || !todayRecord.checkIn?.at) {
        result = await this.service.checkIn(employeeId, location)
      } else {
        result = await this.service.checkOut(employeeId, location)
      }

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

  queryRecords = async (req: Request, res: Response<ApiResponse<any[]>>) => {
    try {
      const query = attendanceRecordQuerySchema.parse(req.query)
      const records = await this.service.getAttendanceRecords(query)
      res.status(HttpStatusCode.OK).json({ data: records, error: null })
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
