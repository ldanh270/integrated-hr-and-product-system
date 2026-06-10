import { ROLE } from "@/configs/entities/employee.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
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
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const { location } = checkInSchema.parse(req.body)
      const record = await this.service.checkIn(employeeId, location, employeeId)
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

  checkOut = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

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

  scan = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

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
        result = await this.service.checkIn(employeeId, location, employeeId)
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

  queryRecords = async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    try {
      const query = attendanceRecordQuerySchema.parse(req.query)
      const userRole = req.user?.role
      const userId = req.user?.empId

      if (!userRole || !userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const allowedRoles = [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER] as const
      const canViewAll = allowedRoles.includes(userRole as (typeof allowedRoles)[number])
      if (!canViewAll) {
        query.employeeId = userId
      }

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
