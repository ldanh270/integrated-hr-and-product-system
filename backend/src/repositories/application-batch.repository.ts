import {
  APPLICATION_SCOPE,
  APPLICATION_TYPES,
  PARTNER_APPROVAL_STATUS,
} from "@/configs/entities/attendance.config.ts"
import {
  IApplicationBatchRepository,
  IListApplicationsQueryDTO,
  ISubmitBatchApplicationDTO,
} from "@/types/attendance.types.ts"

import { ApplicationStatus, ApplicationType, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

// Shared include for sub-applications inside a batch
const BATCH_APPLICATION_INCLUDE = {
  employee: {
    select: { id: true, fullName: true, email: true, position: true, avatarUrl: true },
  },
  approvedBy: { select: { id: true, fullName: true } },
  assignedTo: { select: { id: true, fullName: true } },
  leaveDetail: true,
  overtimeDetail: { include: { employeeShift: { include: { shift: true } } } },
  workFromHomeDetail: true,
  shiftSwapDetail: {
    include: {
      employeeShift: { include: { shift: true } },
      workingShift: true,
      swapWithEmployee: { select: { id: true, fullName: true } },
      swapWithShift: { include: { shift: true } },
    },
  },
  lateEarlyDetail: { include: { employeeShift: { include: { shift: true } } } },
} as const

// Shared include for ApplicationBatch (with sub-applications)
const BATCH_INCLUDE = {
  employee: {
    select: { id: true, fullName: true, email: true, position: true, avatarUrl: true },
  },
  assignedTo: { select: { id: true, fullName: true } },
  applications: {
    include: BATCH_APPLICATION_INCLUDE,
    orderBy: { createdAt: "asc" as const },
  },
} as const

export class PrismaApplicationBatchRepository
  extends BaseRepository
  implements IApplicationBatchRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Creates an ApplicationBatch and all sub-Applications atomically.
   *
   * @param data - The batch submission DTO.
   * @returns The created batch with all sub-applications included.
   */
  async createBatch(data: ISubmitBatchApplicationDTO): Promise<unknown> {
    const { employeeId, type, assignedToId, items } = data

    return this.prisma.$transaction(
      async (tx) => {
        const batch = await tx.applicationBatch.create({
          data: {
            employeeId,
            type: type as ApplicationType,
            assignedToId: assignedToId ?? null,
          },
        })

        await Promise.all(
          items.map((item) =>
            tx.application.create({
              data: {
                employeeId,
                type: type as ApplicationType,
                status: ApplicationStatus.pending,
                startDate: new Date(item.startDate),
                endDate: new Date(item.endDate ?? item.startDate),
                reason: item.reason,
                note: item.note,
                attachmentUrl: item.attachmentUrl,
                attachmentId: item.attachmentId,
                assignedToId: assignedToId ?? null,
                batchId: batch.id,
                ...this._buildDetailCreate(type, item.detail),
              },
            }),
          ),
        )

        return tx.applicationBatch.findUnique({
          where: { id: batch.id },
          include: BATCH_INCLUDE,
        })
      },
      { timeout: 15000, maxWait: 15000 },
    )
  }

  /**
   * Finds a single ApplicationBatch by ID, including all sub-applications.
   *
   * @param id - The batch ID.
   * @returns The batch with sub-applications, or null.
   */
  async findById(id: string): Promise<unknown | null> {
    return this.prisma.applicationBatch.findUnique({
      where: { id },
      include: BATCH_INCLUDE,
    })
  }

  /**
   * Lists batches submitted by a specific employee with pagination.
   *
   * @param employeeId - The employee's ID.
   * @param query - Pagination and filter params.
   */
  async findByEmployee(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: unknown[]; total: number }> {
    const where = this._buildWhere({ ...query, employeeId })
    return this._paginate(where, query)
  }

  /**
   * Lists all batches visible to a manager, with pagination.
   *
   * @param query - Pagination and filter params.
   * @param managedBy - Optional manager context for role-based filtering.
   */
  async findAll(
    query: IListApplicationsQueryDTO,
    managedBy?: { empId: string; role?: string; isApprover?: boolean },
  ): Promise<{ data: unknown[]; total: number }> {
    const where = this._buildWhere(query, managedBy)
    return this._paginate(where, query)
  }

  /**
   * Cancels all pending sub-applications within a batch.
   * Only the batch owner can cancel it.
   *
   * @param id - The batch ID.
   * @param employeeId - The ID of the owner.
   * @returns The updated batch, or null if not found / unauthorized.
   */
  async cancelBatch(id: string, employeeId: string): Promise<unknown | null> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Verify ownership
          const batch = await tx.applicationBatch.findUnique({
            where: { id, employeeId },
            select: { id: true },
          })
          if (!batch) return null

          // Cancel all pending sub-applications
          await tx.application.updateMany({
            where: { batchId: id, status: ApplicationStatus.pending },
            data: { status: ApplicationStatus.cancelled },
          })

          return tx.applicationBatch.findUnique({
            where: { id },
            include: BATCH_INCLUDE,
          })
        },
        { timeout: 10000 },
      )
    } catch {
      return null
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────

  /**
   * Constructs the Prisma nested detail creation payload based on application type.
   */
  private _buildDetailCreate(
    type: string,
    detail: Record<string, unknown>,
  ): Record<string, unknown> {
    switch (type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        return {
          leaveDetail: {
            create: {
              leaveType: detail.leaveType,
              regimeType: detail.regimeType,
            },
          },
        }

      case APPLICATION_TYPES.OVERTIME.LABEL:
        return {
          overtimeDetail: {
            create: { employeeShiftId: detail.employeeShiftId },
          },
        }

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        return {
          workFromHomeDetail: {
            create: { location: detail.location as string | undefined },
          },
        }

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        return {
          shiftSwapDetail: {
            create: {
              employeeShiftId: detail.employeeShiftId,
              workingShiftId: (detail.workingShiftId as string | undefined) ?? null,
              swapWithEmployeeId: (detail.swapWithEmployeeId as string | undefined) ?? null,
              swapWithShiftId: (detail.swapWithShiftId as string | undefined) ?? null,
            },
          },
        }

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        return {
          lateEarlyDetail: {
            create: {
              employeeShiftId: detail.employeeShiftId,
              durationMinutes: detail.durationMinutes,
              isLate: detail.isLate,
            },
          },
        }

      default:
        return {}
    }
  }

  /**
   * Builds the Prisma where clause for batch queries.
   */
  private _buildWhere(
    query: IListApplicationsQueryDTO & { employeeId?: string },
    managedBy?: { empId: string; role?: string; isApprover?: boolean },
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {}

    if (query.employeeId) where.employeeId = query.employeeId
    if (query.type) where.type = query.type
    if (query.startDate || query.endDate) {
      const createdAtFilter: Record<string, Date> = {}
      if (query.startDate) createdAtFilter.gte = new Date(query.startDate)
      if (query.endDate) createdAtFilter.lte = new Date(query.endDate)
      where.createdAt = createdAtFilter
    }

    if (query.keyword) {
      const keyword = query.keyword
      where.OR = [
        { id: { contains: keyword, mode: "insensitive" } },
        { employee: { fullName: { contains: keyword, mode: "insensitive" } } },
      ]
    }

    if (query.status) {
      where.applications = {
        some: { status: query.status },
      }
    }

    if (managedBy) {
      if (query.scope === APPLICATION_SCOPE.ASSIGNED) {
        return {
          AND: [
            where,
            {
              OR: [
                { assignedToId: managedBy.empId },
                {
                  applications: {
                    some: {
                      type: APPLICATION_TYPES.SHIFT_SWAP.LABEL,
                      shiftSwapDetail: {
                        swapWithEmployeeId: managedBy.empId,
                      },
                    },
                  },
                },
              ],
            },
          ],
        }
      } else {
        return where
      }
    }

    return where
  }

  /**
   * Paginates ApplicationBatch records.
   */
  private async _paginate(
    where: Record<string, unknown>,
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: unknown[]; total: number }> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const [data, total] = await this.prisma.$transaction([
      this.prisma.applicationBatch.findMany({
        where,
        include: BATCH_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.applicationBatch.count({ where }),
    ])

    return { data, total }
  }
}
