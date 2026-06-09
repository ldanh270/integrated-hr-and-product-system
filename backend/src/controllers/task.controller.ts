import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { createTaskSchema, updateTaskSchema, listTasksQuerySchema } from "@/schemas/task.schema.ts"
import { ApiResponse, Task, ITaskService, PaginatedTasksDto } from "@/types"

import { Response } from "express"
import { z } from "zod"

export class TaskController {
  constructor(private service: ITaskService) {}

  /**
   * Retrieves a paginated list of tasks
   * Filters include project ID, status, priority, assignee, and search parameters
   * Access control: Users can only view tasks from projects they have access to
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<PaginatedTasksDto>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const query = listTasksQuerySchema.parse(req.query)
      const result = await this.service.listTasks(query, req.user.empId, req.user.role)
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

  /**
   * Retrieves a single task by ID
   * Validates user has access to the parent project before returning task details
   */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    const task = await this.service.getTask(String(req.params.id), req.user.empId, req.user.role)
    if (!task) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Task not found", code: "NOT_FOUND" },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: task, error: null })
  }

  /**
   * Creates a new task within a project
   * Enforces task creation policy of the project (leader_only or all_members)
   * Validates assignee is a member of the project
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const data = createTaskSchema.parse(req.body)
      const task = await this.service.createTask(data, req.user.empId, req.user.role)
      res.status(HttpStatusCode.CREATED).json({ data: task, error: null })
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
   * Updates an existing task
   * Only Admins, project Team Leaders, task creator, or assignee can update
   * Validates new assignee is a member of the project
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const data = updateTaskSchema.parse(req.body)
      const task = await this.service.updateTask(String(req.params.id), data, req.user.empId, req.user.role)
      if (!task) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Task not found", code: "NOT_FOUND" },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: task, error: null })
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
   * Deletes a task by ID
   * Only Admins, project Team Leaders, or task creator can delete
   */
  delete = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    await this.service.deleteTask(String(req.params.id), req.user.empId, req.user.role)
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }
}