import { ROLE } from "@/configs/entities/employee.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ATTENDANCE_ERROR_CODES,
  ATTENDANCE_ERROR_MESSAGES,
  ATTENDANCE_REPORT_HEADERS,
} from "@/constants/attendance.constants.ts"
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

/**
 * Controller for handling attendance-related requests.
 */
export class AttendanceController {
  /**
   * Creates a new AttendanceController instance.
   * @param service - The attendance service implementation.
   */
  constructor(private service: IAttendanceService) {}

  /**
   * Handles check-in requests.
   * @param req - The authenticated request.
   * @param res - The API response.
   */
  checkIn = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      const { location } = checkInSchema.parse(req.body)
      const record = await this.service.checkIn(employeeId, location, employeeId)
      res.status(HttpStatusCode.OK).json({ data: record, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Handles check-out requests.
   * @param req - The authenticated request.
   * @param res - The API response.
   */
  checkOut = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      const { location } = checkOutSchema.parse(req.body)

      const record = await this.service.checkOut(employeeId, location)
      res.status(HttpStatusCode.OK).json({ data: record, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Handles scan requests (either check-in or check-out depending on today's status).
   * @param req - The authenticated request.
   * @param res - The API response.
   */
  scan = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
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
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Queries attendance records based on provided filters.
   * @param req - The authenticated request.
   * @param res - The API response with an array of records.
   */
  queryRecords = async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    try {
      const query = attendanceRecordQuerySchema.parse(req.query)
      const userRole = req.user?.role
      const userId = req.user?.empId

      if (!userRole || !userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
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
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Exports attendance report as CSV.
   * @param req - The authenticated request.
   * @param res - The response object to send the CSV file.
   */
  exportReport = async (req: AuthRequest, res: Response) => {
    try {
      const query = attendanceRecordQuerySchema.parse(req.query)
      const userRole = req.user?.role
      const userId = req.user?.empId

      if (!userRole || !userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      const allowedRoles = [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER] as const
      const canViewAll = allowedRoles.includes(userRole as (typeof allowedRoles)[number])
      if (!canViewAll) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.FORBIDDEN_EXPORT,
            code: ATTENDANCE_ERROR_CODES.FORBIDDEN,
          },
        })
      }

      const records = await this.service.getAttendanceRecords(query)

      const csvRows = [ATTENDANCE_REPORT_HEADERS.join(",")]

      for (const record of records) {
        const dateStr = record.date ? new Date(record.date).toISOString().split("T")[0] : "N/A"
        const shift = record.employeeShift?.shift
        const shiftName = shift?.name || "N/A"
        let scheduledHours = "N/A"
        if (shift) {
          const startHours = Math.floor(shift.startTime / 60)
            .toString()
            .padStart(2, "0")
          const startMins = (shift.startTime % 60).toString().padStart(2, "0")
          const endHours = Math.floor(shift.endTime / 60)
            .toString()
            .padStart(2, "0")
          const endMins = (shift.endTime % 60).toString().padStart(2, "0")
          scheduledHours = `${startHours}:${startMins} - ${endHours}:${endMins}`
        }

        const checkInStr = record.checkInAt
          ? new Date(record.checkInAt).toLocaleTimeString("en-US", { hour12: false })
          : ""
        const checkOutStr = record.checkOutAt
          ? new Date(record.checkOutAt).toLocaleTimeString("en-US", { hour12: false })
          : ""

        const row = [
          dateStr,
          `"${(record.employee?.fullName || "").replace(/"/g, '""')}"`,
          record.employeeId || "",
          record.employee?.email || "",
          `"${shiftName.replace(/"/g, '""')}"`,
          scheduledHours,
          checkInStr,
          checkOutStr,
          record.status || "N/A",
          record.lateMinutes ?? 0,
          record.earlyLeaveMinutes ?? 0,
          record.overtimeMinutes ?? 0,
          record.totalWorkMinutes ?? 0,
        ]
        csvRows.push(row.join(","))
      }

      const csvContent = csvRows.join("\n")
      const filename = `attendance_report_${new Date().toISOString().split("T")[0]}.csv`

      res.setHeader("Content-Type", "text/csv; charset=utf-8")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      res.status(HttpStatusCode.OK).send("\uFEFF" + csvContent)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }
}
