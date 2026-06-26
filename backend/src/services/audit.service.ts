import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CreateAuditLogDto,
  IAuditRepository,
  IAuditService,
  PaginatedAuditLogsDto,
  AuthorizationAuditLog,
  AuditLogQuery,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { prisma } from "../libs/database.ts"
import { PrismaAuditRepository } from "../repositories/audit.repository.ts"

/**
 * Service implementation for managing audit logs, ensuring mutations are logged asynchronously.
 */
export class AuditService implements IAuditService {
  constructor(private auditRepository: IAuditRepository) {}

  /**
   * Log an audit event. Non-blocking, best effort, never breaks business transactions.
   */
  async log(event: CreateAuditLogDto): Promise<void> {
    setImmediate(() => {
      this.auditRepository.createLog(event).catch((err) => {
        console.error("[AuditService] Non-blocking audit logging failed:", err)
      })
    })
  }

  async getLogById(id: string): Promise<AuthorizationAuditLog | null> {
    const log = await this.auditRepository.findLogById(id)
    if (!log) {
      throw new AppError("Audit log not found", HttpStatusCode.NOT_FOUND, "AuditService")
    }
    return log
  }

  async listLogs(query: AuditLogQuery): Promise<PaginatedAuditLogsDto> {
    return this.auditRepository.listLogsPaginated(query)
  }

  async listLogsByEmployee(employeeId: string, query: Omit<AuditLogQuery, "targetEmployeeId">): Promise<PaginatedAuditLogsDto> {
    return this.auditRepository.listLogsByEmployeeId(employeeId, query)
  }

  async listLogsByRole(roleId: string, query: Omit<AuditLogQuery, "targetRoleId">): Promise<PaginatedAuditLogsDto> {
    return this.auditRepository.listLogsByRoleId(roleId, query)
  }
}

export const auditService = new AuditService(new PrismaAuditRepository(prisma))

