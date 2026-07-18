import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { IRegimeCategoryService } from "@/services/regime-category.service.ts"
import { ApiResponse } from "@/types"

import type { RegimeCategory } from "@prisma/client"
import { Request, Response } from "express"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  maxLateMinutes: z.number().int().min(0).max(480),
  maxEarlyMinutes: z.number().int().min(0).max(480),
})

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  maxLateMinutes: z.number().int().min(0).max(480).optional(),
  maxEarlyMinutes: z.number().int().min(0).max(480).optional(),
})

/**
 * Controller for CRUD operations on user-defined regime categories.
 */
export class RegimeCategoryController {
  constructor(private service: IRegimeCategoryService) {}

  /** GET /regime-categories — list all (with lazy defaults seeding) */
  list = async (req: AuthRequest, res: Response<ApiResponse<RegimeCategory[]>>) => {
    const requesterId = req.user!.empId
    const items = await this.service.list(requesterId)
    res.status(HttpStatusCode.OK).json({ data: items, error: null })
  }

  /** POST /regime-categories — create new */
  create = async (req: AuthRequest, res: Response<ApiResponse<RegimeCategory | null>>) => {
    const body = createSchema.parse(req.body)
    const category = await this.service.create({
      ...body,
      createdById: req.user!.empId,
    })
    res.status(HttpStatusCode.CREATED).json({ data: category, error: null })
  }

  /** PATCH /regime-categories/:id — update */
  update = async (
    req: AuthRequest & Request<{ id: string }>,
    res: Response<ApiResponse<RegimeCategory>>,
  ) => {
    const body = updateSchema.parse(req.body)
    const category = await this.service.update(req.params.id, body, req.user!.empId)
    res.status(HttpStatusCode.OK).json({ data: category, error: null })
  }

  /** DELETE /regime-categories/:id */
  delete = async (req: AuthRequest & Request<{ id: string }>, res: Response<ApiResponse<null>>) => {
    await this.service.delete(req.params.id, req.user!.empId)
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }
}
