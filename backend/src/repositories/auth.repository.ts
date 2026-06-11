import { PASSWORD_RESET_STATUS } from "@/configs/auth/auth.config.ts"
import { AuthEmployeeDocument, IAuthRepository } from "@/types/auth.types.ts"

import { ActivityAction, PasswordResetStatus, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Prisma implementation of the Authentication Repository
 * Follows the Repository Pattern to decouple business logic from the database
 */
export class PrismaAuthRepository extends BaseRepository implements IAuthRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Finds an employee by ID
   */
  async findById(id: string): Promise<AuthEmployeeDocument | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
    })

    if (!employee) return null

    return {
      id: employee.id,
      username: employee.username,
      email: employee.email,
      fullName: employee.fullName,
      passwordHash: employee.passwordHash,
      role: employee.role,
      status: employee.status,
      lockedUntil: employee.lockedUntil,
      failedLoginCount: employee.failedLoginCount,
    }
  }

  /**
   * Finds an employee by identifier (username or email)
   * Normalizes input by trimming and converting to lowercase
   */
  async findAuthByIdentifier(identifier: string): Promise<AuthEmployeeDocument | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase()
    const employee = await this.prisma.employee.findFirst({
      where: {
        OR: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
        deletedAt: null,
      },
    })

    if (!employee) return null

    return {
      id: employee.id,
      username: employee.username,
      email: employee.email,
      fullName: employee.fullName,
      passwordHash: employee.passwordHash,
      role: employee.role,
      status: employee.status,
      lockedUntil: employee.lockedUntil,
      failedLoginCount: employee.failedLoginCount,
    }
  }

  /**
   * Finds an employee by email
   */
  async findAuthByEmail(email: string): Promise<AuthEmployeeDocument | null> {
    const normalizedEmail = email.trim().toLowerCase()
    const employee = await this.prisma.employee.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    })

    if (!employee) return null

    return {
      id: employee.id,
      username: employee.username,
      email: employee.email,
      fullName: employee.fullName,
      passwordHash: employee.passwordHash,
      role: employee.role,
      status: employee.status,
      lockedUntil: employee.lockedUntil,
      failedLoginCount: employee.failedLoginCount,
    }
  }

  /**
   * Finds a pending password reset request by token
   */
  async findResetRequestByToken(token: string): Promise<any | null> {
    return this.prisma.passwordResetRequest.findFirst({
      where: {
        token,
        status: PasswordResetStatus.pending,
      },
    })
  }

  /**
   * Finds a pending password reset request by employee ID
   */
  async findPendingRequestByEmployeeId(employeeId: string): Promise<any | null> {
    return this.prisma.passwordResetRequest.findFirst({
      where: {
        employeeId,
        status: PasswordResetStatus.pending,
      },
    })
  }

  /**
   * Creates a new password reset request
   */
  async createResetRequest(data: {
    employeeId: string
    token: string
    expiresAt: Date
  }): Promise<void> {
    await this.prisma.passwordResetRequest.create({
      data: {
        employeeId: data.employeeId,
        token: data.token,
        status: PasswordResetStatus.pending,
        expiresAt: data.expiresAt,
      },
    })
  }

  /**
   * Updates the status of a password reset request
   */
  async updateResetRequestStatus(requestId: string, status: string): Promise<void> {
    let dbStatus: PasswordResetStatus
    if (status === PASSWORD_RESET_STATUS.USED) dbStatus = PasswordResetStatus.used
    else if (status === PASSWORD_RESET_STATUS.EXPIRED) dbStatus = PasswordResetStatus.expired
    else if (status === PASSWORD_RESET_STATUS.APPROVED) dbStatus = PasswordResetStatus.approved
    else if (status === PASSWORD_RESET_STATUS.REJECTED) dbStatus = PasswordResetStatus.rejected
    else dbStatus = PasswordResetStatus.pending

    await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: { status: dbStatus },
    })
  }

  /**
   * Updates employee authentication fields
   */
  async updateAuthEmployee(empId: string, data: Partial<AuthEmployeeDocument>): Promise<void> {
    await this.prisma.employee.update({
      where: { id: empId },
      data: {
        failedLoginCount: data.failedLoginCount,
        lockedUntil: data.lockedUntil,
        passwordHash: data.passwordHash,
      } as any,
    })
  }

  /**
   * Records an authentication-related activity in the ActivityLog collection
   */
  async logActivity(data: {
    empId?: string
    actionType: "login" | "logout" | "failed_login"
    ipAddress?: string
    timestamp: Date
    details?: string
  }): Promise<void> {
    const { empId, timestamp, actionType, ipAddress, details } = data

    let dbActionType: ActivityAction
    if (actionType === "login") dbActionType = ActivityAction.login
    else if (actionType === "logout") dbActionType = ActivityAction.logout
    else dbActionType = ActivityAction.failed_login

    await this.prisma.activityLog.create({
      data: {
        employeeId: empId,
        actionType: dbActionType,
        ipAddress,
        createdAt: timestamp,
        expiresAt: new Date(timestamp.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days retention
        details: details ? JSON.parse(details) : undefined,
      },
    })
  }

  /**
   * Invalidates all pending password reset requests for a user
   */
  async invalidateAllPendingRequests(employeeId: string): Promise<void> {
    await this.prisma.passwordResetRequest.updateMany({
      where: {
        employeeId,
        status: PasswordResetStatus.pending,
      },
      data: {
        status: PasswordResetStatus.used,
      },
    })
  }

  async createPasswordResetRequest(empId: string, token: string): Promise<void> {
    await this.prisma.passwordResetRequest.create({
      data: {
        employeeId: empId,
        token,
        status: PasswordResetStatus.pending,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24h
      },
    })
  }

  async hasPendingPasswordResetRequest(empId: string): Promise<boolean> {
    const existing = await this.prisma.passwordResetRequest.findFirst({
      where: {
        employeeId: empId,
        status: PasswordResetStatus.pending,
      },
    })
    return !!existing
  }
}
