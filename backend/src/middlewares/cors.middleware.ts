import { NextFunction, Request, Response } from "express"

/**
 * Custom CORS middleware
 * Reflects origin for allowed developmental clients, supports standard HTTP methods and headers,
 * and intercepts OPTIONS preflight requests returning a 204 No Content status.
 */
export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
  res.setHeader("Access-Control-Allow-Credentials", "true")

  // Intercept preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.sendStatus(204)
    return
  }

  next()
}
