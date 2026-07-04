import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { createPositionSchema, updatePositionSchema, saveProjectPositionRulesSchema } from "@/schemas/position.schema.ts"
import { ApiResponse, IPositionService, Position, ProjectPositionRule } from "@/types"
import { Response } from "express"
import { z } from "zod"

export class PositionController {
  constructor(private service: IPositionService) {}

  list = async (req: AuthRequest, res: Response<ApiResponse<Position[]>>) => {
    try {
      const result = await this.service.getAllPositions()
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  getOne = async (req: AuthRequest, res: Response<ApiResponse<Position>>) => {
    try {
      const { id } = req.params as { id: string }
      const result = await this.service.getPositionById(id)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  create = async (req: AuthRequest, res: Response<ApiResponse<Position>>) => {
    try {
      const body = createPositionSchema.parse(req.body) as any
      const result = await this.service.createPosition(body)
      res.status(HttpStatusCode.CREATED).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Dữ liệu đầu vào không hợp lệ",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  update = async (req: AuthRequest, res: Response<ApiResponse<Position>>) => {
    try {
      const { id } = req.params as { id: string }
      const body = updatePositionSchema.parse(req.body) as any
      const result = await this.service.updatePosition(id, body)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Dữ liệu đầu vào không hợp lệ",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  delete = async (req: AuthRequest, res: Response<ApiResponse<Position>>) => {
    try {
      const { id } = req.params as { id: string }
      const result = await this.service.deletePosition(id)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  // Project Rules
  listProjectRules = async (req: AuthRequest, res: Response<ApiResponse<ProjectPositionRule[]>>) => {
    try {
      const { projectId } = req.params as { projectId: string }
      const result = await this.service.getProjectRules(projectId)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  saveProjectRules = async (req: AuthRequest, res: Response<ApiResponse<ProjectPositionRule[]>>) => {
    try {
      const { projectId } = req.params as { projectId: string }
      const body = saveProjectPositionRulesSchema.parse(req.body) as any
      const result = await this.service.saveProjectRules(projectId, body.rules)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Dữ liệu đầu vào không hợp lệ",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }
}
