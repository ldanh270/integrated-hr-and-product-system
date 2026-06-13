import {
  ACTIVITY_ACTION,
  ACTIVITY_CATEGORY,
  PASSWORD_RESET_STATUS,
} from "@/configs/auth/auth.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ENVIRONMENT, ENV_ENVIRONMENT } from "@/configs/system/server.config.ts"
import {
  ActivityLogItem,
  ActivityLogQuery,
  AuthResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  GenericAuthResponseDto,
  IAuthRepository,
  IAuthService,
  LockedAccountItem,
  LoginDto,
  LogoutResponseDto,
  PaginatedActivityLogsDto,
  ResetPasswordDto,
  SecuritySummaryDto,
  TokenValidationResponseDto,
  ValidateResetTokenDto,
} from "@/types/auth.types.ts"
import { EmailUtil } from "@/utils/email.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import crypto from "crypto"

/**
 * Authentication Service implementing the business logic for login, logout, and password management
 * Adheres to SOLID principles by depending on IAuthRepository abstraction
 */
export class AuthService implements IAuthService {
  /**
   * Injecting the repository via constructor (Dependency Injection)
   */
  constructor(private repo: IAuthRepository) {}

  /**
   * Handles user login logic: credential verification, account locking, and token generation
   * Normalizes input by trimming and converting to lowercase before repository lookup
   */
  async login(data: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    const { username, password } = data

    // Fetch user through repository using normalized identifier
    const employee = await this.repo.findAuthByIdentifier(username)

    // Security: Generic error for non-existent username to prevent user enumeration
    if (!employee) {
      throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED, "Authentication")
    }

    // Status Check
    if (employee.status === EMPLOYEE_STATUS.TERMINATED) {
      throw new AppError(
        "Tài khoản đã bị chấm dứt do nghỉ việc (Account terminated)",
        HttpStatusCode.FORBIDDEN,
        "Authentication",
      )
    }

    if (employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      throw new AppError(
        "Account is disabled or inactive",
        HttpStatusCode.FORBIDDEN,
        "Authentication",
      )
    }

    // Lock Check (Brute-force protection)
    if (employee.lockedUntil && employee.lockedUntil > new Date()) {
      throw new AppError(
        `Account is temporarily locked. Try again after ${employee.lockedUntil.toLocaleString()}`,
        HttpStatusCode.FORBIDDEN,
        "Authentication",
      )
    }

    // Password Verification
    const isPasswordMatch = await HashUtil.compare(password, employee.passwordHash)

    if (!isPasswordMatch) {
      // Increment failed attempts and lock if threshold reached
      employee.failedLoginCount = (employee.failedLoginCount || 0) + 1

      if (employee.failedLoginCount >= 5) {
        const isNewlyLocked = employee.failedLoginCount === 5
        employee.lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 mins lockout

        // Log account lock
        await this.repo.logActivity({
          empId: employee.id,
          category: ACTIVITY_CATEGORY.SECURITY,
          actionType: ACTIVITY_ACTION.ACCOUNT_LOCKED,
          ipAddress,
          timestamp: new Date(),
          details: JSON.stringify({
            failedLoginCount: employee.failedLoginCount,
            lockedUntil: employee.lockedUntil,
          }),
        })

        // Send lock notification email only on transition to locked state
        if (isNewlyLocked) {
          try {
            await EmailUtil.sendAccountLockedEmail(employee.email, {
              fullName: employee.fullName,
              lockedUntil: employee.lockedUntil,
              failedAttempts: employee.failedLoginCount,
            })
          } catch (emailError) {
            console.error("Failed to send account lock email:", emailError)
          }
        }
      }

      await this.repo.updateAuthEmployee(employee.id, {
        failedLoginCount: employee.failedLoginCount,
        lockedUntil: employee.lockedUntil,
      })

      // Log failed attempt through repository
      await this.repo.logActivity({
        empId: employee.id,
        category: ACTIVITY_CATEGORY.AUTH,
        actionType: ACTIVITY_ACTION.FAILED_LOGIN,
        ipAddress,
        timestamp: new Date(),
      })

      throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED, "Authentication")
    }

    // Successful Login
    employee.failedLoginCount = 0
    employee.lockedUntil = null
    await this.repo.updateAuthEmployee(employee.id, {
      failedLoginCount: employee.failedLoginCount,
      lockedUntil: employee.lockedUntil,
      lastLoginAt: new Date(),
    })

    // Log success through repository
    await this.repo.logActivity({
      empId: employee.id,
      category: ACTIVITY_CATEGORY.AUTH,
      actionType: ACTIVITY_ACTION.LOGIN,
      ipAddress,
      timestamp: new Date(),
    })

    // Generate Token
    const token = JwtUtil.generateToken({
      empId: employee.id,
      username: employee.username,
      role: employee.role,
    })

    return {
      token,
      employee: {
        id: employee.id,
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
      category: ACTIVITY_CATEGORY.AUTH,
      actionType: ACTIVITY_ACTION.LOGOUT,
      ipAddress,
      timestamp: new Date(),
    })

    return { message: "Logged out successfully" }
  }

  /**
   * Handles forgot password logic: generates token and sends reset email
   * Always returns a generic response to prevent user enumeration
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<GenericAuthResponseDto> {
    const { email } = data
    const genericResponse = {
      message: "If an account exists, a reset email has been sent.",
    }

    // Fetch user by normalized email
    const employee = await this.repo.findAuthByEmail(email)

    // Security: Do not reveal if email exists
    if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      return genericResponse
    }

    // Handle existing pending requests
    const existingRequest = await this.repo.findPendingRequestByEmployeeId(employee.id)
    if (existingRequest) {
      const now = new Date()
      // If still valid: do nothing, return generic response
      if (existingRequest.expiresAt > now) {
        if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
          return {
            ...genericResponse,
            debugToken: existingRequest.token,
            note: "Existing unexpired request found.",
          } as any
        }
        return genericResponse
      }

      // If expired: Mark as EXPIRED to allow creating a new one
      await this.repo.updateResetRequestStatus(existingRequest.id, PASSWORD_RESET_STATUS.EXPIRED)
    }

    // Generate a secure plain-text token
    const token = crypto.randomBytes(32).toString("hex")

    // Create the request with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await this.repo.createResetRequest({
      employeeId: employee.id,
      token,
      expiresAt,
    })

    // Send email synchronously via Resend for testing/validation
    try {
      const resendResult = await EmailUtil.sendResetPasswordEmail(employee.email, token)

      // Debugging: Always return token and resend info if not in production
      if (process.env.NODE_ENV !== "production") {
        return {
          message: genericResponse.message,
          debugToken: token,
          expiresAt,
          resend: resendResult,
        } as any
      }
    } catch (error) {
      console.error("Critical error sending reset email:", error)
      // Throw error in dev to see root cause
      if (process.env.NODE_ENV !== "production") {
        throw error
      }
    }

    return genericResponse
  }

  /**
   * Validates a password reset token for status and expiration
   */
  async validateResetToken(data: ValidateResetTokenDto): Promise<TokenValidationResponseDto> {
    const { token } = data

    // Find request by token (only checks status: PENDING in repo)
    const request = await this.repo.findResetRequestByToken(token)

    if (!request) {
      return { isValid: false, message: "Invalid or already used token" }
    }

    // Check expiration in Service layer (15-minute window)
    if (request.expiresAt < new Date()) {
      await this.repo.updateResetRequestStatus(request.id, PASSWORD_RESET_STATUS.EXPIRED)
      return { isValid: false, message: "Reset link has expired" }
    }

    return { isValid: true }
  }

  /**
   * Resets a user's password using a valid token
   */
  async resetPassword(data: ResetPasswordDto): Promise<GenericAuthResponseDto> {
    const { token, newPassword } = data

    // Validate token status and expiration
    const validation = await this.validateResetToken({ token })
    if (!validation.isValid) {
      throw new AppError(
        validation.message || "Invalid token",
        HttpStatusCode.BAD_REQUEST,
        "Authentication",
      )
    }

    // Find the request again to get employee info
    const request = await this.repo.findResetRequestByToken(token)
    if (!request) {
      throw new AppError("Reset request not found", HttpStatusCode.NOT_FOUND, "Authentication")
    }

    // Update employee password
    const employee = await this.repo.findById(request.employeeId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "Authentication")
    }

    // Security: Prevent resetting to the same password
    const isSamePassword = await HashUtil.compare(newPassword, employee.passwordHash)
    if (isSamePassword) {
      throw new AppError(
        "New password must be different from current password",
        HttpStatusCode.BAD_REQUEST,
        "Authentication",
      )
    }

    const passwordHash = await HashUtil.hash(newPassword)
    await this.repo.updateAuthEmployee(employee.id, { passwordHash })

    // Mark request as used
    await this.repo.updateResetRequestStatus(request.id, PASSWORD_RESET_STATUS.USED)

    return { message: "Password reset successfully. You can now login with your new password." }
  }

  /**
   * Changes an authenticated user's password
   */
  async changePassword(empId: string, data: ChangePasswordDto): Promise<GenericAuthResponseDto> {
    const { oldPassword, newPassword } = data

    // Fetch employee with password hash
    const employee = await this.repo.findById(empId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "Authentication")
    }

    // Verify current password
    const isMatch = await HashUtil.compare(oldPassword, employee.passwordHash)
    if (!isMatch) {
      throw new AppError(
        "Incorrect current password",
        HttpStatusCode.UNAUTHORIZED,
        "Authentication",
      )
    }

    // Security: Prevent changing to the same password
    const isSamePassword = await HashUtil.compare(newPassword, employee.passwordHash)
    if (isSamePassword) {
      throw new AppError(
        "New password must be different from current password",
        HttpStatusCode.BAD_REQUEST,
        "Authentication",
      )
    }

    // Update to new password
    const passwordHash = await HashUtil.hash(newPassword)
    await this.repo.updateAuthEmployee(employee.id, { passwordHash })

    return { message: "Password changed successfully." }
  }

  /**
   * Gets activity logs with filtering and pagination
   */
  async getActivityLogs(query: ActivityLogQuery): Promise<PaginatedActivityLogsDto> {
    return this.repo.listActivityLogs(query)
  }

  /**
   * Gets a single activity log detail
   */
  async getActivityLogDetail(id: string): Promise<ActivityLogItem | null> {
    return this.repo.getActivityLogById(id)
  }

  /**
   * Gets security dashboard summary
   */
  async getSecuritySummary(): Promise<SecuritySummaryDto> {
    const [
      lockedAccounts,
      failedLoginsToday,
      successfulLoginsToday,
      recentSecurityEvents,
      recentRoleEvents,
    ] = await Promise.all([
      this.repo.getLockedEmployees(),
      this.repo.countActivityLogsToday(ACTIVITY_CATEGORY.AUTH, ACTIVITY_ACTION.FAILED_LOGIN),
      this.repo.countActivityLogsToday(ACTIVITY_CATEGORY.AUTH, ACTIVITY_ACTION.LOGIN),
      this.repo.getRecentLogsByCategory(ACTIVITY_CATEGORY.SECURITY, 5),
      this.repo.getRecentLogsByCategory(ACTIVITY_CATEGORY.ROLE, 5),
    ])

    return {
      lockedAccountsCount: lockedAccounts.length,
      failedLoginsToday,
      successfulLoginsToday,
      recentSecurityEvents,
      recentRoleEvents,
    }
  }

  /**
   * Gets all currently locked accounts
   */
  async getLockedAccounts(): Promise<LockedAccountItem[]> {
    return this.repo.getLockedEmployees()
  }

  /**
   * Unlocks an employee account and logs the action
   */
  async unlockAccount(empId: string, actorId: string, ipAddress?: string): Promise<void> {
    const employee = await this.repo.findById(empId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "Authentication")
    }

    await this.repo.unlockEmployee(empId)

    // Log the unlock action
    await this.repo.logActivity({
      empId,
      category: ACTIVITY_CATEGORY.SECURITY,
      actionType: ACTIVITY_ACTION.ACCOUNT_UNLOCKED,
      ipAddress,
      timestamp: new Date(),
      details: JSON.stringify({
        actorId,
        message: "Account manually unlocked by administrator",
      }),
    })
  }
}
