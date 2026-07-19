import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { UPLOAD_CONFIG } from "@/configs/system/upload.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  approveApplicationSchema,
  cancelApplicationSchema,
  listApplicationsQuerySchema,
  rejectApplicationSchema,
  submitApplicationSchema,
  submitBulkApplicationsSchema,
  swapRejectApplicationSchema,
} from "@/schemas/attendance.schema.ts"
import { ApiResponse } from "@/types"
import { IApplicationService, IApplicationStatusStatsDTO } from "@/types/attendance.types.ts"
import { CloudinaryUtil } from "@/utils/cloudinary.util.ts"
import { AppError } from "@/utils/error.util.ts"

import { Request, Response } from "express"
import { z } from "zod"

interface ApplicationListMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: IApplicationStatusStatsDTO
}

export class ApplicationController {
  constructor(private service: IApplicationService) {}

  uploadAttachment = async (req: AuthRequest, res: Response) => {
    if (!req.file)
      throw new AppError("No file uploaded", HttpStatusCode.BAD_REQUEST, "ApplicationController")
    if (!req.user)
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")

    const { url, id } = await CloudinaryUtil.uploadStream(req.file.buffer, {
      folder: UPLOAD_CONFIG.CLOUDINARY_FOLDERS.APPLICATIONS,
      resource_type: "auto",
      public_id: `attachment_${Date.now()}_${req.user.empId}`,
      overwrite: true,
    })

    res.status(HttpStatusCode.OK).json({ data: { url, id }, error: null })
  }

  /**
   * Submits a new application (leave, overtime, etc.) for the logged-in employee.
   * Ensures the employee ID is retrieved securely from the authenticated user context.
   *
   * @param req - The authenticated request containing the application payload.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the created application.
   */
  submit = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const employeeId = req.user.empId // §SEC: always from JWT, never from body
      const data = submitApplicationSchema.parse(req.body)
      const result = await this.service.submitApplication({ ...data, employeeId })

      res.status(HttpStatusCode.CREATED).json({
        data: result,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError("Invalid input", HttpStatusCode.BAD_REQUEST, "ApplicationController")
      }
      throw error
    }
  }

  /**
   * Submits multiple applications in bulk for the logged-in employee.
   * Ensures the employee ID is retrieved securely from the authenticated user context.
   */
  submitBulk = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const employeeId = req.user.empId // §SEC: always from JWT, never from body
      const data = submitBulkApplicationsSchema.parse(req.body)

      const bulkData = data.forms.map((form) => ({
        ...form,
        employeeId,
      }))

      const result = await this.service.submitBulkApplications(bulkData)

      res.status(HttpStatusCode.CREATED).json({
        data: result,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(
          "Invalid input data format",
          HttpStatusCode.BAD_REQUEST,
          "ApplicationController",
        )
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
  getById = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    const requester = req.user ? { empId: req.user.empId } : undefined
    const app = await this.service.getApplicationById(String(req.params.id), requester)
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
  listAll = async (req: Request, res: Response<ApiResponse<unknown, ApplicationListMeta>>) => {
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
          stats: result.stats,
        },
      })
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

  /**
   * Lists applications that the currently authenticated employee has permission to approve.
   * Supports pagination, filtering, and sorting query parameters.
   *
   * @param req - The authenticated request containing query filters and pagination params.
   * @param res - The response object containing the paginated API response.
   * @returns A promise that resolves to the response with the list of applications to approve.
   */
  listApprovals = async (
    req: AuthRequest,
    res: Response<ApiResponse<unknown, ApplicationListMeta>>,
  ) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const approverId = req.user.empId
      const query = listApplicationsQuerySchema.parse(req.query)
      const result = await this.service.getApprovalsList(approverId, query)
      res.status(HttpStatusCode.OK).json({
        data: result.data,
        error: null,
        meta: {
          total: result.total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(result.total / (query.pageSize ?? 20)),
          stats: result.stats,
        },
      })
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

  /**
   * Lists the applications belonging only to the currently authenticated employee.
   * Supports pagination, filtering, and sorting query parameters.
   *
   * @param req - The authenticated request containing query params.
   * @param res - The response object containing the paginated API response.
   * @returns A promise that resolves to the response with the employee's own applications.
   */
  listMine = async (req: AuthRequest, res: Response<ApiResponse<unknown, ApplicationListMeta>>) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const employeeId = req.user.empId
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
          stats: result.stats,
        },
      })
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

  /**
   * Lists applications for a specific employee by their employee ID (intended for admin/HR view).
   * Validates that the requester has sufficient permissions if necessary.
   *
   * @param req - The authenticated request with the target employee ID parameter and query parameters.
   * @param res - The response object containing the paginated API response.
   * @returns A promise that resolves to the response with the employee's applications.
   */
  listByEmployee = async (
    req: AuthRequest,
    res: Response<ApiResponse<unknown, ApplicationListMeta>>,
  ) => {
    try {
      const employeeId = String(req.params.employeeId ?? "")
      if (!employeeId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Missing employeeId in request body",
            code: "VALIDATION_ERROR",
          },
        })
      }

      const query = listApplicationsQuerySchema.parse(req.query)
      const requester = req.user ? { empId: req.user.empId } : undefined
      const result = await this.service.getEmployeeApplications(employeeId, query, requester)
      res.status(HttpStatusCode.OK).json({
        data: result.data,
        error: null,
        meta: {
          total: result.total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(result.total / (query.pageSize ?? 20)),
          stats: result.stats,
        },
      })
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

  /**
   * Cancels a pending application by the employee who submitted it.
   *
   * @param req - The authenticated request containing the application ID parameter and cancellation reasons.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the updated application status.
   */
  cancel = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const employeeId = req.user.empId
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
  approve = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const processorId = req.user.empId // §SEC: from JWT
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

  /**
   * Rejects a pending application with a specified reason (intended for managers/HR).
   * Registers the authenticated user as the processor of the application.
   *
   * @param req - The authenticated request containing the application ID parameter and rejection reason.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the rejected application.
   */
  reject = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const processorId = req.user.empId // §SEC: from JWT
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

  /**
   * Swap partner confirms the shift swap (partner_pending → pending).
   * Only the designated swap-with employee may call this.
   */
  swapConfirm = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const partnerId = req.user.empId
      const app = await this.service.confirmSwapPartner(String(req.params.id), partnerId)
      res.status(HttpStatusCode.OK).json({ data: app, error: null })
    } catch (error) {
      throw error
    }
  }

  /**
   * Swap partner rejects the shift swap (partner_pending → rejected).
   */
  swapReject = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      if (!req.user)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "ApplicationController")
      const partnerId = req.user.empId
      const { rejectReason } = swapRejectApplicationSchema.parse(req.body)
      const app = await this.service.rejectSwapPartner(
        String(req.params.id),
        partnerId,
        rejectReason || "",
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
