import { HttpStatusCode } from "@/configs/http.config.ts"
import PasswordResetRequest from "@/entities/auth/PasswordResetRequest.ts"
import {
  AuthResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  IAuthRepository,
  IAuthService,
  LoginDto,
  LogoutResponseDto,
} from "@/types/auth.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import crypto from "crypto"

/**
 * Authentication Service implementing the business logic for login and logout
 * Adheres to SOLID principles by depending on IAuthRepository abstraction
 */
export class AuthService implements IAuthService {
  /**
   * Injecting the repository via constructor (Dependency Injection)
   */
  constructor(private repo: IAuthRepository) {}

  /**
   * Handles user login logic: credential verification, account locking, and token generation
   */
  async login(data: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    const { username, password } = data

    // 1. Fetch user through repository
    const employee = await this.repo.findAuthByUsername(username)

    // Security: Generic error for non-existent username to prevent user enumeration
    if (!employee) {
      throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED, "Authentication")
    }

    // 2. Status Check
    if (employee.status !== "active") {
      throw new AppError(
        "Account is disabled or inactive",
        HttpStatusCode.FORBIDDEN,
        "Authentication",
      )
    }

    // 3. Lock Check (Brute-force protection)
    if (employee.lockedUntil && employee.lockedUntil > new Date()) {
      throw new AppError(
        `Account is temporarily locked. Try again after ${employee.lockedUntil.toLocaleTimeString()}`,
        HttpStatusCode.FORBIDDEN,
        "Authentication",
      )
    }

    // 4. Password Verification
    const isPasswordMatch = await HashUtil.compare(password, employee.passwordHash)

    if (!isPasswordMatch) {
      // Increment failed attempts and lock if threshold reached
      employee.failedLoginCount = (employee.failedLoginCount || 0) + 1

      if (employee.failedLoginCount >= 5) {
        employee.lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 mins lockout
      }

      await employee.save()

      // Log failed attempt through repository
      await this.repo.logActivity({
        empId: employee._id,
        actionType: "failed-login",
        ipAddress,
        timestamp: new Date(),
      })

      throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED, "Authentication")
    }

    // 5. Successful Login
    employee.failedLoginCount = 0
    employee.lockedUntil = undefined
    employee.lastLoginAt = new Date()
    await employee.save()

    // Log success through repository
    await this.repo.logActivity({
      empId: employee._id,
      actionType: "login",
      ipAddress,
      timestamp: new Date(),
    })

    // 6. Generate Token
    const token = JwtUtil.generateToken({
      empId: employee._id,
      username: employee.username,
      role: employee.role,
    })

    return {
      token,
      employee: {
        id: employee._id,
        username: employee.username,
        email: employee.email,
        fullName: employee.fullName,
        role: employee.role,
      },
    }
  }

  /**
   * Handles user logout logic: currently just records the activity
   */
  async logout(empId: string, ipAddress?: string): Promise<LogoutResponseDto> {
    // Log logout activity through repository
    await this.repo.logActivity({
      empId,
      actionType: "logout",
      ipAddress,
      timestamp: new Date(),
    })

    return { message: "Logged out successfully" }
  }

  /**
   * Handles forgot password logic
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    const { username } = data

    // 1. Fetch user through repository
    const employee = await this.repo.findAuthByUsername(username)

    if (!employee) {
      // Don't leak if the user exists or not
      return {
        message: "If an account with that username exists, a reset request has been created.",
      }
    }

    if (employee.status !== "active") {
      return {
        message: "If an account with that username exists, a reset request has been created.",
      }
    }

    // 2. Check if a pending request already exists
    const existingRequest = await PasswordResetRequest.findOne({
      employeeId: employee._id,
      status: "pending",
    })

    if (existingRequest) {
      return {
        message: "If an account with that username exists, a reset request has been created.",
      }
    }

    // 3. Generate a secure token
    const token = crypto.randomBytes(32).toString("hex")

    // 4. Create the request
    await PasswordResetRequest.create({
      employeeId: employee._id,
      token,
      status: "pending",
    })

    return { message: "If an account with that username exists, a reset request has been created." }
  }
}
