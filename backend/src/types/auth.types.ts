import { EmployeeRole } from "./employee.types.ts"

/**
 * Data Transfer Object for Login request
 */
export interface LoginDto {
  username: string
  password: string
}

export interface ForgotPasswordDto {
  username: string
}

/**
 * Data Transfer Object for successful authentication response
 */
export interface AuthResponseDto {
  token: string
  employee: {
    id: any // MongoDB ObjectId
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

export interface ForgotPasswordResponseDto {
  message: string
}

/**
 * Internal interface for Employee document used in auth logic
 */
export interface AuthEmployeeDocument {
  _id: any
  username: string
  email: string
  fullName: string
  passwordHash: string
  role: EmployeeRole
  status: string
  lockedUntil?: Date
  failedLoginCount: number
  lastLoginAt?: Date
  save(): Promise<any>
}

/**
 * Interface for Authentication Repository (Data Access Layer)
 */
export interface IAuthRepository {
  /**
   * Finds an employee by username, including the password hash
   */
  findAuthByUsername(username: string): Promise<AuthEmployeeDocument | null>

  /**
   * Logs an activity to the database
   */
  logActivity(data: {
    empId?: any
    actionType: "login" | "logout" | "failed-login"
    ipAddress?: string
    timestamp: Date
    details?: string
  }): Promise<void>
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
  forgotPassword(data: ForgotPasswordDto): Promise<ForgotPasswordResponseDto>
}
