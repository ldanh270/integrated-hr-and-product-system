import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createProjectTaskStatusSchema,
  updateProjectTaskStatusSchema,
  deleteProjectTaskStatusSchema,
} from "@/schemas/project-task-status.schema.ts"
import { ApiResponse, IProjectTaskStatusService, ProjectTaskStatus } from "@/types"
import { Response } from "express"
import { z } from "zod"

export class ProjectTaskStatusController {
  constructor(private service: IProjectTaskStatusService) {}

  list = async (req: AuthRequest, res: Response<ApiResponse<ProjectTaskStatus[]>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId } = req.params as { projectId: string }
      const result = await this.service.listStatuses(projectId, req.user.empId, req.user.role)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
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

  getOne = async (req: AuthRequest, res: Response<ApiResponse<ProjectTaskStatus>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { id } = req.params as { id: string }
      const result = await this.service.getStatus(id, req.user.empId, req.user.role)
      if (!result) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Status not found", code: ErrorCode.NOT_FOUND },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  create = async (req: AuthRequest, res: Response<ApiResponse<ProjectTaskStatus>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId } = req.params as { projectId: string }
      const payload = createProjectTaskStatusSchema.parse({
        ...req.body,
        projectId,
      })

      const result = await this.service.createStatus(payload, req.user.empId, req.user.role)
      res.status(HttpStatusCode.CREATED).json({ data: result, error: null })
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

  update = async (req: AuthRequest, res: Response<ApiResponse<ProjectTaskStatus>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { id } = req.params as { id: string }
      const payload = updateProjectTaskStatusSchema.parse(req.body)

      const result = await this.service.updateStatus(id, payload, req.user.empId, req.user.role)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
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

  delete = async (req: AuthRequest, res: Response<ApiResponse<{ success: boolean }>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { id } = req.params as { id: string }
      const { fallbackStatusId } = deleteProjectTaskStatusSchema.parse(req.query)

      const result = await this.service.deleteStatus(id, fallbackStatusId, req.user.empId, req.user.role)
      res.status(HttpStatusCode.OK).json({ data: { success: result }, error: null })
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
