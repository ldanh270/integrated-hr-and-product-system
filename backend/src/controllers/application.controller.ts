import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  approveApplicationSchema,
  cancelApplicationSchema,
  listApplicationsQuerySchema,
  rejectApplicationSchema,
  submitApplicationSchema,
} from "@/schemas/attendance.schema.ts"
import { ApiResponse } from "@/types"
import { IApplicationService } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { Request, Response } from "express"
import { z } from "zod"

export class ApplicationController {
  constructor(private service: IApplicationService) {}

  // ─── Submit ──────────────────────────────────────────────────

  submit = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user!.empId // §SEC: always from JWT, never from body
      const data = submitApplicationSchema.parse(req.body)
      const app = await this.service.submitApplication({ ...data, employeeId } as any)
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

  // ─── Get by ID ────────────────────────────────────────────────

  getById = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    const app = await this.service.getApplicationById(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: app, error: null })
  }

  // ─── List (manager view — all employees) ─────────────────────

  listAll = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const query = listApplicationsQuerySchema.parse(req.query)
      const result = await this.service.listApplications(query)
      res.status(HttpStatusCode.OK).json({
        data: result.data,
        error: null,
        meta: {
          total: result.total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(result.total / (query.pageSize ?? 20)),
        },
      } as any)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Invalid query parameters",
            code: "VALIDATION_ERROR",
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  // ─── List own applications ────────────────────────────────────

  listMine = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user!.empId
      const query = listApplicationsQuerySchema.parse(req.query)
      const result = await this.service.getEmployeeApplications(employeeId, query)
      res.status(HttpStatusCode.OK).json({
        data: result.data,
        error: null,
        meta: {
          total: result.total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(result.total / (query.pageSize ?? 20)),
        },
      } as any)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Invalid query parameters",
            code: "VALIDATION_ERROR",
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  // ─── List by specific employee (for HR/admin) ─────────────────

  listByEmployee = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = String(req.params.employeeId)
      console.error(employeeId)

      const query = listApplicationsQuerySchema.parse(req.query)
      const requester = req.user ? { empId: req.user.empId, role: req.user.role } : undefined
      const result = await this.service.getEmployeeApplications(employeeId, query, requester)
      res.status(HttpStatusCode.OK).json({
        data: result.data,
        error: null,
        meta: {
          total: result.total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(result.total / (query.pageSize ?? 20)),
        },
      } as any)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Invalid query parameters",
            code: "VALIDATION_ERROR",
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  // ─── Cancel ──────────────────────────────────────────────────

  cancel = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user!.empId
      cancelApplicationSchema.parse(req.body ?? {}) // validates optional reason field
      const app = await this.service.cancelApplication(String(req.params.id), employeeId)
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

  // ─── Approve ──────────────────────────────────────────────────

  approve = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const processorId = req.user!.empId // §SEC: from JWT
      approveApplicationSchema.parse(req.body) // validates status=approved only

      const app = await this.service.approveApplication(String(req.params.id), processorId)
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

  // ─── Reject ───────────────────────────────────────────────────

  reject = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const processorId = req.user!.empId // §SEC: from JWT
      const { rejectReason } = rejectApplicationSchema.parse(req.body)

      const app = await this.service.rejectApplication(
        String(req.params.id),
        processorId,
        rejectReason,
      )
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
}
