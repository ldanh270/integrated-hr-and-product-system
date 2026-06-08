import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { createWorkingShiftSchema, updateWorkingShiftSchema } from "@/schemas/shift.schema.ts"
import { ApiResponse } from "@/types"
import { IShiftService } from "@/types/shift.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

export class ShiftController {
  constructor(private service: IShiftService) {}

  create = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const reqData = createWorkingShiftSchema.parse(req.body)
      const data = { ...reqData, createdById: (req as AuthRequest).user?.empId || "system" }
      const shift = await this.service.createShift(data)
      res.status(HttpStatusCode.CREATED).json({ data: shift, error: null })
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

  update = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const data = updateWorkingShiftSchema.parse(req.body)
      const shift = await this.service.updateShift(String(req.params.id), data)
      res.status(HttpStatusCode.OK).json({ data: shift, error: null })
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

  getOne = async (req: Request, res: Response<ApiResponse<any>>) => {
    const shift = await this.service.getShift(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: shift, error: null })
  }

  list = async (req: Request, res: Response<ApiResponse<any>>) => {
    const shifts = await this.service.listShifts()
    res.status(HttpStatusCode.OK).json({ data: shifts, error: null })
  }
}
