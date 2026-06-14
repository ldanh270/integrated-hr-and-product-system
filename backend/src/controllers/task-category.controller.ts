// Import HTTP status codes configuration
import { HttpStatusCode } from "@/configs/system/http.config.ts"
// Import custom Express Request type holding authenticated user profile info
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
// Import input validation Zod schemas for task categories
import {
  createTaskCategorySchema,
  updateTaskCategorySchema,
} from "@/schemas/task-category.schema.ts"
// Import shared type definitions for API responses and services
import { ApiResponse, ITaskCategoryService, TaskCategory } from "@/types"
// Import centralized error codes and error layers
import { ErrorCode, ErrorLayer } from "@/configs/system/error-code.config.ts"
// Import application error utility
import { AppError } from "@/utils/error.util.ts"

// Import Express Response type and Zod library
import { Response } from "express"
import { z } from "zod"

// Controller class to manage HTTP requests for task categories
export class TaskCategoryController {
  // Inject the task category service interface via constructor
  constructor(private service: ITaskCategoryService) {}

  // Retrieves list of categories registered under a project
  list = async (req: AuthRequest, res: Response<ApiResponse<TaskCategory[]>>) => {
    try {
      // Return 401 Unauthorized if user credentials are not found in request context
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      // Extract project ID from URL parameters
      const projectId = String(req.params.projectId)
      // Call service layer to fetch the categories list for the project
      const result = await this.service.listByProject(projectId, req.user.empId, req.user.role)
      // Return the result array
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      console.error("Error in list task categories controller:", error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError(
        error instanceof Error ? error.message : "Internal server error",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.CONTROLLER,
        ErrorCode.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Creates a new task category under a project
  create = async (req: AuthRequest, res: Response<ApiResponse<TaskCategory>>) => {
    try {
      // Verify authorization credentials
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      // Extract project ID from URL parameters
      const projectId = String(req.params.projectId)
      // Validate request body properties against Zod schema
      const data = createTaskCategorySchema.parse(req.body)
      // Call service layer to persist the new category
      const result = await this.service.create(projectId, data, req.user.empId, req.user.role)
      // Return the newly created category object
      res.status(HttpStatusCode.CREATED).json({ data: result, error: null })
    } catch (error) {
      // Catch and return Zod validation errors with 400 Bad Request
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: ErrorCode.VALIDATION_ERROR, meta: error.issues },
        })
      }
      console.error("Error in create task category controller:", error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError(
        error instanceof Error ? error.message : "Internal server error",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.CONTROLLER,
        ErrorCode.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Updates an existing category properties
  update = async (req: AuthRequest, res: Response<ApiResponse<TaskCategory>>) => {
    try {
      // Verify authorization credentials
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      // Extract project ID and category ID from URL parameters
      const projectId = String(req.params.projectId)
      const id = String(req.params.id)
      // Validate request body properties against Zod schema
      const data = updateTaskCategorySchema.parse(req.body)
      // Call service layer to perform update logic
      const result = await this.service.update(projectId, id, data, req.user.empId, req.user.role)
      // Return updated category object
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      // Catch and return Zod validation errors with 400 Bad Request
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: ErrorCode.VALIDATION_ERROR, meta: error.issues },
        })
      }
      console.error("Error in update task category controller:", error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError(
        error instanceof Error ? error.message : "Internal server error",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.CONTROLLER,
        ErrorCode.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Deletes a task category
  delete = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    try {
      // Verify authorization credentials
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      // Extract project ID and category ID from URL parameters
      const projectId = String(req.params.projectId)
      const id = String(req.params.id)
      // Call service layer to delete the category
      await this.service.delete(projectId, id, req.user.empId, req.user.role)
      // Return success status
      res.status(HttpStatusCode.OK).json({ data: null, error: null })
    } catch (error) {
      console.error("Error in delete task category controller:", error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError(
        error instanceof Error ? error.message : "Internal server error",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.CONTROLLER,
        ErrorCode.INTERNAL_SERVER_ERROR
      )
    }
  }
}
