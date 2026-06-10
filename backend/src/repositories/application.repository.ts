import { PAID_LEAVE_TYPES } from "@/configs/entities/attendance.config.ts"
import {
  IApplicationRepository,
  IApplicationStatus,
  ILeaveType,
  IListApplicationsQueryDTO,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"

import { ApplicationStatus, ApplicationType, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

// Shared include shape — returns all detail relations + employee info
const APPLICATION_INCLUDE = {
  employee: {
    select: { id: true, fullName: true, email: true, position: true, avatarUrl: true },
  },
  approvedBy: { select: { id: true, fullName: true } },
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
  businessTripDetail: true,
  lateEarlyDetail: { include: { employeeShift: { include: { shift: true } } } },
  regimeDetail: true,
} as const

export class PrismaApplicationRepository extends BaseRepository implements IApplicationRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  // ── Submit ────────────────────────────────────────────────────

  async submit(data: ISubmitApplicationDTO): Promise<any> {
    const { employeeId, type, startDate, endDate, reason, note, detail } = data as any

    return this.prisma.application.create({
      data: {
        employeeId,
        type: type as ApplicationType,
        status: ApplicationStatus.pending,
        startDate: new Date(startDate),
        endDate: new Date(endDate ?? startDate),
        reason,
        note,
        ...this._buildDetailCreate(data),
      },
      include: APPLICATION_INCLUDE,
    })
  }

  // ── Read ──────────────────────────────────────────────────────

  async findById(id: string): Promise<any | null> {
    return this.prisma.application.findUnique({
      where: { id },
      include: APPLICATION_INCLUDE,
    })
  }

  async findByEmployee(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: any[]; total: number }> {
    const where = this._buildWhere({ ...query, employeeId })
    return this._paginate(where, query)
  }

  async findAll(query: IListApplicationsQueryDTO): Promise<{ data: any[]; total: number }> {
    const where = this._buildWhere(query)
    return this._paginate(where, query)
  }

  // ── Mutations ─────────────────────────────────────────────────

  async cancel(id: string, employeeId: string): Promise<any | null> {
    try {
      return await this.prisma.application.update({
        where: {
          id,
          employeeId,
          status: ApplicationStatus.pending, // DB-level guard
        },
        data: { status: ApplicationStatus.cancelled },
        include: APPLICATION_INCLUDE,
      })
    } catch {
      return null // record not found or status guard failed
    }
  }

  async approve(id: string, status: IApplicationStatus, approvedBy: string): Promise<any | null> {
    try {
      return await this.prisma.application.update({
        where: { id },
        data: {
          status: status as ApplicationStatus,
          approvedById: approvedBy,
          approvedAt: new Date(),
        },
        include: APPLICATION_INCLUDE,
      })
    } catch {
      return null
    }
  }

  // ── Business-Rule Helpers ─────────────────────────────────────

  async checkLeaveOverlap(
    employeeId: string,
    startDate: string | Date,
    endDate: string | Date,
    excludeId?: string,
  ): Promise<boolean> {
    const existing = await this.prisma.application.findFirst({
      where: {
        employeeId,
        type: ApplicationType.leave,
        status: { in: [ApplicationStatus.pending, ApplicationStatus.approved] },
        // Overlap: existing.startDate <= endDate AND existing.endDate >= startDate
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
    return existing !== null
  }

  /**
   * Count working days used for a specific leaveType in a given calendar year.
   * Counts only approved leave applications.
   */
  async getUsedLeaveDays(employeeId: string, leaveType: ILeaveType, year: number): Promise<number> {
    // Only count if it's a paid leave type that has a quota
    if (!PAID_LEAVE_TYPES.includes(leaveType)) return 0

    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59)

    // Query ApplicationLeaveDetail directly — cleaner than include + type-cast
    const leaveDetails = await this.prisma.applicationLeaveDetail.findMany({
      where: {
        leaveType: leaveType as any,
        application: {
          employeeId,
          status: ApplicationStatus.approved,
          startDate: { gte: yearStart },
          endDate: { lte: yearEnd },
        },
      },
      include: { application: { select: { startDate: true, endDate: true } } },
    })

    // Sum calendar days (simplified; can integrate holiday calendar for working-day count)
    return leaveDetails.reduce((total, detail) => {
      const { startDate, endDate } = detail.application
      const diffMs = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1
      return total + diffDays
    }, 0)
  }



  // ── Private Helpers ───────────────────────────────────────────

  private _buildDetailCreate(data: ISubmitApplicationDTO): Record<string, any> {
    switch (data.type) {
      case "leave":
        return {
          leaveDetail: {
            create: {
              leaveType: data.detail.leaveType,
              regimeType: data.detail.regimeType,
            },
          },
        }

      case "overtime":
        return {
          overtimeDetail: {
            create: { employeeShiftId: data.detail.employeeShiftId },
          },
        }

      case "work_from_home":
        return {
          workFromHomeDetail: {
            create: { location: data.detail?.location },
          },
        }

      case "shift_swap":
        return {
          shiftSwapDetail: {
            create: {
              employeeShiftId: data.detail.employeeShiftId,
              workingShiftId: data.detail.workingShiftId ?? null,
              swapWithEmployeeId: data.detail.swapWithEmployeeId ?? null,
              swapWithShiftId: data.detail.swapWithShiftId ?? null,
            },
          },
        }

      case "business_trip":
        return {
          businessTripDetail: {
            create: {
              location: data.detail.location,
              purpose: data.detail.purpose ?? null,
              budget: data.detail.budget ?? null,
            },
          },
        }

      case "late_early":
        return {
          lateEarlyDetail: {
            create: {
              employeeShiftId: data.detail.employeeShiftId,
              durationMinutes: data.detail.durationMinutes,
              isLate: data.detail.isLate,
            },
          },
        }

      case "regime":
        return {
          regimeDetail: {
            create: {
              regimeType: data.detail.regimeType,
              reducedMinutesPerDay: data.detail.reducedMinutesPerDay,
              applyToStart: data.detail.applyToStart ?? false,
              applyToEnd: data.detail.applyToEnd ?? false,
              documentUrl: data.detail.documentUrl ?? null,
            },
          },
        }

      default:
        return {}
    }
  }

  private _buildWhere(query: IListApplicationsQueryDTO & { employeeId?: string }) {
    const where: Record<string, any> = {}

    if (query.employeeId) where.employeeId = query.employeeId
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.startDate || query.endDate) {
      where.startDate = {}
      if (query.startDate) where.startDate.gte = new Date(query.startDate)
      if (query.endDate) where.startDate.lte = new Date(query.endDate)
    }

    return where
  }

  private async _paginate(
    where: Record<string, any>,
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: any[]; total: number }> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const [data, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: APPLICATION_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.application.count({ where }),
    ])

    return { data, total }
  }
}
