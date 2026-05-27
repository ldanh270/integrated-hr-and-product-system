import { JWT_EXPIRES_IN, JWT_SECRET } from "@/configs/constants/auth.config.ts"

import jwt from "jsonwebtoken"

export class JwtUtil {
  static generateToken(payload: object): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    })
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return null
    }
  }
}
