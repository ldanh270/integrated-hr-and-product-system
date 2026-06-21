import { ErrorCode, ErrorLayer } from "@/configs/system/error-code.config.ts"
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

  /**
   * Submits a new application (leave, overtime, etc.) for the logged-in employee.
   * Ensures the employee ID is retrieved securely from the authenticated user context.
   * 
   * @param req - The authenticated request containing the application payload.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the created application.
   */
  submit = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId // §SEC: always from JWT, never from body
      if (!employeeId) throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)
      const data = submitApplicationSchema.parse(req.body)
      const app = await this.service.submitApplication({ ...data, employeeId } as any)
      res.status(HttpStatusCode.CREATED).json({ data: app, error: null })
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
   * Retrieves a specific application by its unique identifier.
   * 
   * @param req - The authenticated request containing the application ID in the parameters.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the application details.
   */
  getById = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    const app = await this.service.getApplicationById(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: app, error: null })
  }

  /**
   * Lists all applications across the organization (intended for manager/HR view).
   * Supports pagination, filtering, and sorting query parameters.
   * 
   * @param req - The HTTP request containing query filters and pagination params.
   * @param res - The response object containing the paginated API response.
   * @returns A promise that resolves to the response with the list of applications.
   */
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
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Lists the applications belonging only to the currently authenticated employee.
   * Supports pagination, filtering, and sorting query parameters.
   * 
   * @param req - The authenticated request containing query params.
   * @param res - The response object containing the paginated API response.
   * @returns A promise that resolves to the response with the employee's own applications.
   */
  listMine = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)
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
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Lists applications for a specific employee by their employee ID (intended for admin/HR view).
   * Validates that the requester has sufficient permissions if necessary.
   * 
   * @param req - The authenticated request with the target employee ID parameter and query parameters.
   * @param res - The response object containing the paginated API response.
   * @returns A promise that resolves to the response with the employee's applications.
   */
  listByEmployee = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = String(req.body?.employeeId ?? "")
      if (!employeeId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Missing employeeId in request body",
            code: ErrorCode.VALIDATION_ERROR,
          },
        })
      }

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
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Cancels a pending application by the employee who submitted it.
   * 
   * @param req - The authenticated request containing the application ID parameter and cancellation reasons.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the updated application status.
   */
  cancel = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)
      cancelApplicationSchema.parse(req.body ?? {}) // validates optional reason field
      const app = await this.service.cancelApplication(String(req.params.id), employeeId)
      res.status(HttpStatusCode.OK).json({ data: app, error: null })
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
   * Approves a pending application (intended for managers/HR).
   * Registers the authenticated user as the processor of the application.
   * 
   * @param req - The authenticated request containing the application ID parameter.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the approved application.
   */
  approve = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const processorId = req.user?.empId // §SEC: from JWT
      if (!processorId) throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)
      approveApplicationSchema.parse(req.body) // validates status=approved only

      const app = await this.service.approveApplication(String(req.params.id), processorId)
      res.status(HttpStatusCode.OK).json({ data: app, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: ErrorCode.VALIDATION_ERROR, meta: error.issues },
        })
      }
      throw error
    }
  }

  /**
   * Rejects a pending application with a specified reason (intended for managers/HR).
   * Registers the authenticated user as the processor of the application.
   * 
   * @param req - The authenticated request containing the application ID parameter and rejection reason.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the rejected application.
   */
  reject = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const processorId = req.user?.empId // §SEC: from JWT
      if (!processorId) throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)
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
          error: { message: "Validation error", code: ErrorCode.VALIDATION_ERROR, meta: error.issues },
        })
      }
      throw error
    }
  }

  /**
   * Partner approves or rejects a shift swap application.
   */
  partnerApprove = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const partnerId = req.user?.empId
      if (!partnerId) throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER, ErrorCode.UNAUTHORIZED)

      const schema = z.object({ isApproved: z.boolean() })
      const { isApproved } = schema.parse(req.body)

      const app = await this.service.partnerApproveSwap(
        String(req.params.id),
        partnerId,
        isApproved,
      )
      res.status(HttpStatusCode.OK).json({ data: app, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: ErrorCode.VALIDATION_ERROR, meta: error.issues },
        })
      }
      throw error
    }
  }
}
