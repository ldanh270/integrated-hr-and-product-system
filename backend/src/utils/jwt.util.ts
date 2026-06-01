import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL } from "@/configs/auth/auth.config.ts"

import jwt from "jsonwebtoken"

/**
 * JwtUtil provides helper methods for signing and verifying JSON Web Tokens
 */
export class JwtUtil {
  /**
   * Generates a new JWT for a given payload
   * Expiration time and secret are retrieved from auth config
   */
  static generateToken(payload: object): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    })
  }

  /**
   * Verifies a JWT and returns the decoded payload if valid
   * Returns null if the token is invalid or expired to facilitate clean checks
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET)
    } catch (error) {
      return null
    }
  }
}
