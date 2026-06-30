import {
  AuditLogQuery,
  AuthorizationAuditLog,
  CreateAuditLogDto,
  IAuditRepository,
  PaginatedAuditLogsDto,
} from "@/types"

import { Prisma, AuthorizationAuditLog as PrismaAuditLog, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for managing AuthorizationAuditLog records in PostgreSQL.
 */
export class PrismaAuditRepository extends BaseRepository implements IAuditRepository {
  /**
   * Initializes audit repository with Prisma client.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Maps Prisma audit log record to domain audit log object.
   */
  protected mapToDomain(
    log: PrismaAuditLog & {
      actor?: { fullName: string } | null
      targetEmployee?: { fullName: string } | null
    },
  ): AuthorizationAuditLog {
    return {
      id: log.id,
      actorId: log.actorId,
      targetEmployeeId: log.targetEmployeeId,
      targetRoleId: log.targetRoleId,
      targetPermissionId: log.targetPermissionId,
      action: log.action,
      oldValue: log.oldValue,
      newValue: log.newValue,
      metadata: log.metadata,
      createdAt: log.createdAt,
      actor: log.actor ? { fullName: log.actor.fullName } : null,
      targetEmployee: log.targetEmployee ? { fullName: log.targetEmployee.fullName } : null,
    }
  }

  /**
   * Creates a new authorization audit log entry.
   */
  async createLog(data: CreateAuditLogDto): Promise<AuthorizationAuditLog> {
    const log = await this.prisma.authorizationAuditLog.create({
      data: {
        actorId: data.actorId || null,
        targetEmployeeId: data.targetEmployeeId || null,
        targetRoleId: data.targetRoleId || null,
        targetPermissionId: data.targetPermissionId || null,
        action: data.action,
        oldValue:
          data.oldValue !== undefined ? (data.oldValue as Prisma.InputJsonValue) : Prisma.JsonNull,
        newValue:
          data.newValue !== undefined ? (data.newValue as Prisma.InputJsonValue) : Prisma.JsonNull,
        metadata:
          data.metadata !== undefined ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })
    return this.mapToDomain(log)
  }

  /**
   * Retrieves a single audit log by its identifier.
   */
  async findLogById(id: string): Promise<AuthorizationAuditLog | null> {
    const log = await this.prisma.authorizationAuditLog.findUnique({
      where: { id },
      include: {
        actor: { select: { fullName: true } },
        targetEmployee: { select: { fullName: true } },
      },
    })
    return log ? this.mapToDomain(log) : null
  }

  /**
   * Lists audit logs with pagination and optional filtering.
   */
  async listLogsPaginated(query: AuditLogQuery): Promise<PaginatedAuditLogsDto> {
    const {
      page = 1,
      limit = 50,
      actorId,
      targetEmployeeId,
      targetRoleId,
      action,
      category,
    } = query
    const skip = (page - 1) * limit
    const where: Prisma.AuthorizationAuditLogWhereInput = {}

    if (actorId) where.actorId = actorId
    if (targetEmployeeId) where.targetEmployeeId = targetEmployeeId
    if (targetRoleId) where.targetRoleId = targetRoleId

    if (action) {
      where.action = action
    } else if (category) {
      if (category === "role") {
        where.action = {
          in: [
            "ROLE_ASSIGNED",
            "ROLE_REVOKED",
            "ROLE_REPLACED",
            "ROLE_CREATED",
            "ROLE_UPDATED",
            "ROLE_DELETED",
          ],
        }
      } else if (category === "permission") {
        where.action = {
          in: [
            "PERMISSION_ASSIGNED",
            "PERMISSION_REVOKED",
            "PERMISSION_REPLACED",
            "PERMISSION_CREATED",
            "PERMISSION_UPDATED",
            "PERMISSION_DELETED",
          ],
        }
      } else if (category === "employee") {
        where.action = { in: ["EMPLOYEE_DEACTIVATED", "EMPLOYEE_DELETED"] }
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.authorizationAuditLog.findMany({
        where,
        include: {
          actor: { select: { fullName: true } },
          targetEmployee: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: Number(skip),
        take: Number(limit),
      }),
      this.prisma.authorizationAuditLog.count({ where }),
    ])

    return {
      data: data.map((log) => this.mapToDomain(log)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Lists audit logs scoped to a specific employee.
   */
  async listLogsByEmployeeId(
    employeeId: string,
    query: Omit<AuditLogQuery, "targetEmployeeId">,
  ): Promise<PaginatedAuditLogsDto> {
    return this.listLogsPaginated({ ...query, targetEmployeeId: employeeId })
  }

  /**
   * Lists audit logs scoped to a specific role.
   */
  async listLogsByRoleId(
    roleId: string,
    query: Omit<AuditLogQuery, "targetRoleId">,
  ): Promise<PaginatedAuditLogsDto> {
    return this.listLogsPaginated({ ...query, targetRoleId: roleId })
  }
}
