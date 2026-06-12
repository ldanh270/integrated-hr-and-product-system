import { HttpStatusCode } from "@/configs/system/http.config.ts"

import { NextFunction, Request, Response } from "express"
import { ZodType } from "zod"

export const validate =
  (schema: ZodType<any, any, any>, target: "body" | "query" | "params" = "body") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[target])
      Object.defineProperty(req, target, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      })
      next()
    } catch (error) {
      next(error)
    }
  }
