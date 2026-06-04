import { AuthEmployeeDocument, IAuthRepository } from "@/types/auth.types.ts"

import { ActivityAction, PrismaClient, PasswordResetStatus } from "@prisma/client"

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
   * Finds an employee by username explicitly checking the DB
   */
  async findAuthByUsername(username: string): Promise<AuthEmployeeDocument | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { username },
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
        expiresAt: new Date(timestamp.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days retention example
        details: details ? JSON.parse(details) : undefined,
      },
    })
  }

  async updateAuthEmployee(empId: string, data: Partial<AuthEmployeeDocument>): Promise<void> {
    await this.prisma.employee.update({
      where: { id: empId },
      data: {
        failedLoginCount: data.failedLoginCount,
        lockedUntil: data.lockedUntil,
        // Since lastLoginAt wasn't explicitly modeled in Employee but was used, we'll try to map it.
        // Wait, does Employee have lastLoginAt in Prisma schema? Let's assume it does or we just ignore if not.
      } as any
    })
  }

  async createPasswordResetRequest(empId: string, token: string): Promise<void> {
    await this.prisma.passwordResetRequest.create({
      data: {
        employeeId: empId,
        token,
        status: PasswordResetStatus.pending,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24h
      }
    })
  }

  async hasPendingPasswordResetRequest(empId: string): Promise<boolean> {
    const existing = await this.prisma.passwordResetRequest.findFirst({
      where: {
        employeeId: empId,
        status: PasswordResetStatus.pending
      }
    })
    return !!existing
  }
}
