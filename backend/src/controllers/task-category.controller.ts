import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createTaskCategorySchema,
  updateTaskCategorySchema,
} from "@/schemas/task-category.schema.ts"
import { ApiResponse, ITaskCategoryService, TaskCategory } from "@/types"

import { Response } from "express"
import { z } from "zod"

export class TaskCategoryController {
  constructor(private service: ITaskCategoryService) {}

  list = async (req: AuthRequest, res: Response<ApiResponse<TaskCategory[]>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const projectId = String(req.params.projectId)
      const result = await this.service.listByProject(projectId, req.user.empId, req.user.role)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  create = async (req: AuthRequest, res: Response<ApiResponse<TaskCategory>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const projectId = String(req.params.projectId)
      const data = createTaskCategorySchema.parse(req.body)
      const result = await this.service.create(projectId, data, req.user.empId, req.user.role)
      res.status(HttpStatusCode.CREATED).json({ data: result, error: null })
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

  update = async (req: AuthRequest, res: Response<ApiResponse<TaskCategory>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const projectId = String(req.params.projectId)
      const id = String(req.params.id)
      const data = updateTaskCategorySchema.parse(req.body)
      const result = await this.service.update(projectId, id, data, req.user.empId, req.user.role)
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

  delete = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const projectId = String(req.params.projectId)
      const id = String(req.params.id)
      await this.service.delete(projectId, id, req.user.empId, req.user.role)
      res.status(HttpStatusCode.OK).json({ data: null, error: null })
    } catch (error) {
      throw error
    }
  }
}
