import { PASSWORD_RESET_STATUS } from "@/configs/auth/auth.config.ts"
import Employee from "@/entities/Employee.ts"
import ActivityLog from "@/entities/auth/ActivityLog.ts"
import PasswordResetRequest from "@/entities/auth/PasswordResetRequest.ts"
import { AuthEmployeeDocument, IAuthRepository } from "@/types/auth.types.ts"

import { BaseRepository } from "./base.repository.ts"

/**
 * MongoDB implementation of the Authentication Repository
 * Follows the Repository Pattern to decouple business logic from the database
 */
export class MongoAuthRepository extends BaseRepository<any> implements IAuthRepository {
  constructor() {
    super(Employee)
  }

  /**
   * Finds an employee by ID
   */
  async findById(id: string): Promise<AuthEmployeeDocument | null> {
    const employee = await this.model.findById(id).select("+passwordHash")
    return employee as unknown as AuthEmployeeDocument
  }

  /**
   * Finds an employee by identifier (username or email)
   * Normalizes input by trimming and converting to lowercase
   */
  async findAuthByIdentifier(identifier: string): Promise<AuthEmployeeDocument | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase()
    const employee = await this.model
      .findOne({
        $or: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
      })
      .select("+passwordHash")
    return employee as unknown as AuthEmployeeDocument
  }

  /**
   * Finds a pending password reset request by email
   */
  async findAuthByEmail(email: string): Promise<AuthEmployeeDocument | null> {
    const normalizedEmail = email.trim().toLowerCase()
    const employee = await this.model.findOne({ email: normalizedEmail })
    return employee as unknown as AuthEmployeeDocument
  }

  /**
   * Finds a pending password reset request by employee ID
   */
  async findPendingRequestByEmployeeId(employeeId: string): Promise<any | null> {
    return PasswordResetRequest.findOne({
      employeeId,
      status: PASSWORD_RESET_STATUS.PENDING,
    })
  }

  /**
   * Finds a pending password reset request by token
   */
  async findResetRequestByToken(token: string): Promise<any | null> {
    return PasswordResetRequest.findOne({
      token: token.trim(),
      status: PASSWORD_RESET_STATUS.PENDING,
    })
  }

  /**
   * Creates a new password reset request
   */
  async createResetRequest(data: {
    employeeId: any
    token: string
    expiresAt: Date
  }): Promise<void> {
    await PasswordResetRequest.create({
      employeeId: data.employeeId,
      token: data.token,
      expiresAt: data.expiresAt,
      status: PASSWORD_RESET_STATUS.PENDING,
    })
  }

  /**
   * Updates the status of a password reset request
   */
  async updateResetRequestStatus(requestId: any, status: string): Promise<void> {
    await PasswordResetRequest.findByIdAndUpdate(requestId, { status })
  }

  /**
   * Records an authentication-related activity in the ActivityLog collection
   */
  async logActivity(data: {
    empId?: any
    actionType: "login" | "logout" | "failed-login"
    ipAddress?: string
    timestamp: Date
    details?: string
  }): Promise<void> {
    const { empId, timestamp, ...rest } = data
    await ActivityLog.create({
      employeeId: empId,
      ...rest,
    })
  }

  /**
   * Invalidates all pending password reset requests for a user
   * (used when resetting password successfully)
   */
  async invalidateAllPendingRequests(employeeId: string): Promise<void> {
    await PasswordResetRequest.updateMany(
      {
        employeeId,
        status: PASSWORD_RESET_STATUS.PENDING,
      },
      {
        status: PASSWORD_RESET_STATUS.USED,
      },
    )
  }
}
