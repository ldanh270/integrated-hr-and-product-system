import { NextFunction, Request, Response } from "express"

const getAllowedOrigins = () => {
  const configured = process.env.CORS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configured?.length) return new Set(configured)

  return new Set(
    [process.env.CLIENT_URL, process.env.FRONTEND_URL]
      .filter((origin): origin is string => Boolean(origin))
      .map((origin) => origin.trim()),
  )
}

export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin
  const allowedOrigins = getAllowedOrigins()

  if (origin) {
    if (typeof origin !== "string" || !allowedOrigins.has(origin)) {
      res.status(403).json({
        data: null,
        error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin không được phép" },
        meta: null,
      })
      return
    }
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Vary", "Origin")
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
