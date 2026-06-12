import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { createWorkingShiftSchema, updateWorkingShiftSchema } from "@/schemas/shift.schema.ts"
import { ApiResponse } from "@/types"
import { IShiftService } from "@/types/shift.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

/**
 * Controller for handling shift-related requests.
 */
export class ShiftController {
  /**
   * Creates a new ShiftController instance.
   * @param service - The shift service implementation.
   */
  constructor(private service: IShiftService) {}

  /**
   * Creates a new working shift.
   * @param req - Request object with shift data in body.
   * @param res - API response with the created shift.
   */
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
   * Updates an existing working shift.
   * @param req - Request object with shift ID in params and updated data in body.
   * @param res - API response with the updated shift.
   */
  update = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      const data = updateWorkingShiftSchema.parse(req.body)
      const shift = await this.service.updateShift(String(req.params.id), data)
      res.status(HttpStatusCode.OK).json({ data: shift, error: null })
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
   * Deletes a working shift.
   * @param req - Request object with shift ID in params.
   * @param res - API response with null data.
   */
  delete = async (req: Request, res: Response<ApiResponse<null>>) => {
    await this.service.deleteShift(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  /**
   * Gets a single working shift by ID.
   * @param req - Request object with shift ID in params.
   * @param res - API response with the shift data.
   */
  getOne = async (req: Request, res: Response<ApiResponse<any>>) => {
    const shift = await this.service.getShift(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: shift, error: null })
  }

  /**
   * Lists all working shifts.
   * @param req - Request object.
   * @param res - API response with a list of shifts.
   */
  list = async (req: Request, res: Response<ApiResponse<any>>) => {
    const shifts = await this.service.listShifts()
    res.status(HttpStatusCode.OK).json({ data: shifts, error: null })
  }
}
