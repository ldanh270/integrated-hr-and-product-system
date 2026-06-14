import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_TTL,
} from "@/configs/auth/auth.config.ts"

import jwt from "jsonwebtoken"

/**
 * JwtUtil provides helper methods for signing and verifying JSON Web Tokens
 */
export class JwtUtil {
  /**
   * Generates a new Access Token for a given payload
   */
  static generateAccessToken(payload: object): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    })
  }

  /**
   * Generates a new Refresh Token for a given payload
   */
  static generateRefreshToken(payload: object): string {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    })
  }

  /**
   * Verifies an Access Token and returns the decoded payload if valid
   */
  static verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET)
    } catch (error) {
      return null
    }
  }

  /**
   * Verifies a Refresh Token and returns the decoded payload if valid
   */
  static verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET)
    } catch (error) {
      return null
    }
  }
}
