import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  addProjectMemberSchema,
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "@/schemas/project.schema.ts"
import { ApiResponse, IProjectService, PaginatedProjectsDto, Project } from "@/types"

import { Response } from "express"
import { z } from "zod"

export class ProjectController {
  constructor(private service: IProjectService) {}

  list = async (req: AuthRequest, res: Response<ApiResponse<PaginatedProjectsDto>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const query = listProjectsQuerySchema.parse(req.query)
      const result = await this.service.listProjects(query, req.user.empId, req.user.role)
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

  getOne = async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    const project = await this.service.getProject(
      String(req.params.id),
      req.user.empId,
      req.user.role,
    )
    if (!project) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Project not found", code: "NOT_FOUND" },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: project, error: null })
  }

  create = async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const data = createProjectSchema.parse(req.body)
      const project = await this.service.createProject(data, req.user.empId, req.user.role)
      res.status(HttpStatusCode.CREATED).json({ data: project, error: null })
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

  update = async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const data = updateProjectSchema.parse(req.body)
      const project = await this.service.updateProject(
        String(req.params.id),
        data,
        req.user.empId,
        req.user.role,
      )
      if (!project) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Project not found", code: "NOT_FOUND" },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: project, error: null })
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
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    await this.service.deleteProject(String(req.params.id), req.user.empId, req.user.role)
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  addMember = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const { employeeId } = addProjectMemberSchema.parse(req.body)
      await this.service.addMember(String(req.params.id), employeeId, req.user.empId, req.user.role)
      res.status(HttpStatusCode.OK).json({ data: null, error: null })
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

  removeMember = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    await this.service.removeMember(
      String(req.params.id),
      String(req.params.employeeId),
      req.user.empId,
      req.user.role,
    )
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  getMembers = async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    const members = await this.service.getMembers(
      String(req.params.id),
      req.user.empId,
      req.user.role,
    )
    res.status(HttpStatusCode.OK).json({ data: members, error: null })
  }
}
