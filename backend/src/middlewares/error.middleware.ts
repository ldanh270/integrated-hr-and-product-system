import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import { AppError } from "@/utils/error.util.ts"

import { NextFunction, Request, Response } from "express"

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    console.error(`[ERROR - ${err.layer}] : ${err.message}`)
    return res.status(err.statusCode).json({ 
      message: err.message, 
      type: err.errorCode || "APP_ERROR",
      layer: err.layer 
    })
  }

  // Unhandled errors (crashes, syntax errors...)
  console.error(`[UNHANDLED CRASH] : `, err)
  return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" })
}
