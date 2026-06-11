import { PasswordResetRequestType } from "@/entities/auth/PasswordResetRequest.ts"

import { EmployeeRole } from "./employee.types.ts"

/**
 * Data Transfer Object for Login request
 */
export interface LoginDto {
  username: string
  password: string
}

/**
 * Data Transfer Object for Forgot Password request
 */
export interface ForgotPasswordDto {
  email: string
}

/**
 * Data Transfer Object for Change Password request
 */
export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}

/**
 * Data Transfer Object for Reset Password request
 */
export interface ResetPasswordDto {
  token: string
  newPassword: string
}

/**
 * Data Transfer Object for Token Validation request
 */
export interface ValidateResetTokenDto {
  token: string
}

/**
 * Data Transfer Object for successful authentication response
 */
export interface AuthResponseDto {
  token: string
  employee: {
    id: string
    username: string
    email: string
    fullName: string
    role: EmployeeRole
  }
}

/**
 * Data Transfer Object for logout response
 */
export interface LogoutResponseDto {
  message: string
}

/**
 * Data Transfer Object for generic authentication message response
 */
export interface GenericAuthResponseDto {
  message: string
}

/**
 * Data Transfer Object for token validation response
 */
export interface TokenValidationResponseDto {
  isValid: boolean
  message?: string
}

/**
 * Internal interface for Employee document used in auth logic
 */
export interface AuthEmployeeDocument {
  id: string
  username: string
  email: string
  fullName: string
  passwordHash: string
  role: EmployeeRole
  status: string
  lockedUntil?: Date | null
  failedLoginCount: number
  lastLoginAt?: Date | null
}

/**
 * Interface for Authentication Repository (Data Access Layer)
 */
export interface IAuthRepository {
  /**
   * Finds an employee by ID, including the password hash
   */
  findById(id: string): Promise<AuthEmployeeDocument | null>

  /**
   * Finds an employee by identifier (username or email), including the password hash
   */
  findAuthByIdentifier(identifier: string): Promise<AuthEmployeeDocument | null>

  /**
   * Finds an employee by email
   */
  findAuthByEmail(email: string): Promise<AuthEmployeeDocument | null>

  /**
   * Finds a pending password reset request by employee ID
   */
  findPendingRequestByEmployeeId(employeeId: string): Promise<any | null>

  /**
   * Finds a pending password reset request by token
   */
  findResetRequestByToken(token: string): Promise<any | null>

  /**
   * Invalidates all pending password reset requests for a user
   */
  invalidateAllPendingRequests(employeeId: string): Promise<void>

  /**
   * Creates a new password reset request
   */
  createResetRequest(data: { employeeId: any; token: string; expiresAt: Date }): Promise<void>

  /**
   * Updates the status of a password reset request
   */
  updateResetRequestStatus(requestId: any, status: string): Promise<void>

  /**
   * Logs an activity to the database
   */
  logActivity(data: {
    empId?: any
    actionType: "login" | "logout" | "failed_login"
    ipAddress?: string
    timestamp: Date
    details?: string
  }): Promise<void>

  updateAuthEmployee(empId: string, data: Partial<AuthEmployeeDocument>): Promise<void>
  createPasswordResetRequest(empId: string, token: string): Promise<void>
  hasPendingPasswordResetRequest(empId: string): Promise<boolean>
}

/**
 * Interface for Authentication Service (Business Logic Layer)
 */
export interface IAuthService {
  /**
   * Authenticates a user and returns a token
   */
  login(data: LoginDto, ipAddress?: string): Promise<AuthResponseDto>

  /**
   * Processes a logout for a user
   */
  logout(empId: string, ipAddress?: string): Promise<LogoutResponseDto>

  /**
   * Processes a forgot password request
   */
  forgotPassword(data: ForgotPasswordDto): Promise<GenericAuthResponseDto>

  /**
   * Validates a password reset token
   */
  validateResetToken(data: ValidateResetTokenDto): Promise<TokenValidationResponseDto>

  /**
   * Resets a user's password using a token
   */
  resetPassword(data: ResetPasswordDto): Promise<GenericAuthResponseDto>

  /**
   * Changes a user's password (requires current password)
   */
  changePassword(empId: string, data: ChangePasswordDto): Promise<GenericAuthResponseDto>
}
