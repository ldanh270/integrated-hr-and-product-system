import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AppError } from "@/utils/error.util.ts"

import { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"

/**
 * Global error handling middleware for Express.
 * Handles AppError, ZodError, and generic internal server errors.
 * 
 * @param err - The error object.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    console.error(`[ERROR - ${err.layer}] : ${err.message}`)
    return res.status(err.statusCode).json({
      message: err.message,
      type: err.errorCode || "APP_ERROR",
      layer: err.layer,
    })
  }

  if (err instanceof ZodError) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      message: "Validation Error",
      errors: err.issues,
      type: "VALIDATION_ERROR",
    })
  }

  // Unhandled errors (crashes, syntax errors...)
  console.error(`[UNHANDLED CRASH] : `, err)
  return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" })
}
