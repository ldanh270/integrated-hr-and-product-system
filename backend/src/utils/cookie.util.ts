import { ACCESS_TOKEN_TTL_MS } from "@/configs/auth/auth.config.ts"

import { Response } from "express"

const isProduction = process.env.NODE_ENV === "production"

export class CookieUtil {
  static setAccessToken(res: Response, token: string): void {
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: ACCESS_TOKEN_TTL_MS,
      path: "/",
    })
  }

  static setRefreshToken(res: Response, token: string, expiresAt: Date): void {
    res.cookie("refresh_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      expires: expiresAt,
      path: "/api/auth/refresh",
    })
  }

  static clearTokens(res: Response): void {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    })
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/api/auth/refresh",
    })
  }
}
