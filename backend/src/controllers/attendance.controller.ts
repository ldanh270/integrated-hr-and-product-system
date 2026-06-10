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

  checkIn = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
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

  exportReport = async (req: AuthRequest, res: Response) => {
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
        return res.status(HttpStatusCode.FORBIDDEN).json({
          data: null,
          error: { message: "Forbidden: Only HR and Admins can export reports", code: "FORBIDDEN" },
        })
      }

      const records = await this.service.getAttendanceRecords(query)

      const headers = [
        "Date",
        "Employee Name",
        "Employee ID",
        "Email",
        "Shift Name",
        "Scheduled Hours",
        "Check In",
        "Check Out",
        "Status",
        "Late (min)",
        "Early Leave (min)",
        "Overtime (min)",
        "Total Work (min)",
      ]

      const csvRows = [headers.join(",")]

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
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }
}
