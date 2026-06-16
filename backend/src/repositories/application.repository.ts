import { PAID_LEAVE_TYPES } from "@/configs/entities/attendance.config.ts"
import {
  IApplicationRepository,
  IApplicationWithDetails,
  IApplicationListResult,
  APPLICATION_INCLUDE,
  ILeaveType,
  IListApplicationsQueryDTO,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"

import { ApplicationStatus, ApplicationType, Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

// Re-export for consumers that import from repository
export type { IApplicationWithDetails }

export class PrismaApplicationRepository extends BaseRepository implements IApplicationRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Creates and submits a new application with the correct detail relation in a single query.
   * 
   * @param data - The application details and parameters.
   * @returns A promise that resolves to the newly created application with all included relations.
   */
  async submit(data: ISubmitApplicationDTO): Promise<IApplicationWithDetails> {
    const { employeeId, type, startDate, endDate, reason, note } = data

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
      } as Prisma.ApplicationUncheckedCreateInput,
      include: APPLICATION_INCLUDE,
    })
  }

  /**
   * Finds a single application by its unique identifier.
   * 
   * @param id - The application ID.
   * @returns A promise that resolves to the application details or null if not found.
   */
  async findById(id: string): Promise<IApplicationWithDetails | null> {
    return this.prisma.application.findUnique({
      where: { id },
      include: APPLICATION_INCLUDE,
    })
  }

  /**
   * Retrieves a paginated list of applications for a specific employee.
   * 
   * @param employeeId - The employee's ID.
   * @param query - The pagination and filter parameters.
   * @returns A promise that resolves to the matching applications and total count.
   */
  async findByEmployee(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResult> {
    const where = this._buildWhere({ ...query, employeeId })
    return this._paginate(where, query)
  }

  /**
   * Retrieves a paginated list of all applications in the database, with filters.
   * 
   * @param query - The pagination and filter parameters.
   * @returns A promise that resolves to the matching applications and total count.
   */
  async findAll(query: IListApplicationsQueryDTO): Promise<IApplicationListResult> {
    const where = this._buildWhere(query)
    return this._paginate(where, query)
  }

  /**
   * Cancels a pending application if it belongs to the specified employee.
   * 
   * @param id - The application ID.
   * @param employeeId - The ID of the employee owning the application.
   * @returns A promise that resolves to the updated application, or null if update failed.
   */
  async cancel(id: string, employeeId: string): Promise<IApplicationWithDetails | null> {
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

  /**
   * Approves a pending application and records the approving processor.
   * 
   * @param id - The application ID.
   * @param approvedBy - The ID of the processor approving the application.
   * @returns A promise that resolves to the updated application, or null if update failed.
   */
  async approve(id: string, approvedBy: string): Promise<IApplicationWithDetails | null> {
    try {
      return await this.prisma.application.update({
        where: { id, status: ApplicationStatus.pending },
        data: {
          status: ApplicationStatus.approved,
          approvedById: approvedBy,
          approvedAt: new Date(),
          rejectReason: null,
        },
        include: APPLICATION_INCLUDE,
      })
    } catch {
      return null
    }
  }

  /**
   * Rejects a pending application, recording the processor and the rejection reason.
   * 
   * @param id - The application ID.
   * @param rejectedBy - The ID of the processor rejecting the application.
   * @param rejectReason - The explanation for rejection.
   * @returns A promise that resolves to the updated application, or null if update failed.
   */
  async reject(id: string, rejectedBy: string, rejectReason: string): Promise<IApplicationWithDetails | null> {
    try {
      return await this.prisma.application.update({
        where: { id, status: ApplicationStatus.pending },
        data: {
          status: ApplicationStatus.rejected,
          approvedById: rejectedBy,
          approvedAt: new Date(),
          rejectReason,
        },
        include: APPLICATION_INCLUDE,
      })
    } catch {
      return null
    }
  }

  /**
   * Checks if an employee has any pending or approved leave applications overlapping with the specified range.
   * 
   * @param employeeId - The employee's ID.
   * @param startDate - The starting date of the range.
   * @param endDate - The ending date of the range.
   * @param excludeId - Optional application ID to exclude from comparison.
   * @returns A promise that resolves to true if an overlap exists, false otherwise.
   */
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
   * Calculates the total number of approved leave days used by an employee for a specific leave type in a given year.
   * 
   * @param employeeId - The employee's ID.
   * @param leaveType - The type of leave.
   * @param year - The calendar year.
   * @returns A promise that resolves to the number of used leave days.
   */
  async getUsedLeaveDays(employeeId: string, leaveType: ILeaveType, year: number): Promise<number> {
    // Only count if it's a paid leave type that has a quota
    if (!PAID_LEAVE_TYPES.includes(leaveType)) return 0

    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59)

    // Query ApplicationLeaveDetail directly — cleaner than include + type-cast
    const leaveDetails = await this.prisma.applicationLeaveDetail.findMany({
      where: {
        leaveType,
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

  /**
   * Constructs the nested detail creation payload for Prisma based on the application type.
   * 
   * @param data - The application submission DTO.
   * @returns The Prisma nested write object for details.
   */
  private _buildDetailCreate(data: ISubmitApplicationDTO): Partial<Prisma.ApplicationCreateInput> {
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

  /**
   * Constructs the Prisma database filter conditions from query parameters.
   * 
   * @param query - The filter parameters.
   * @returns The Prisma filter object.
   */
  private _buildWhere(query: IListApplicationsQueryDTO & { employeeId?: string }) {
    const where: Prisma.ApplicationWhereInput = {}

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

  /**
   * Executes a paginated query and counts matching records within a single database transaction.
   * 
   * @param where - The Prisma filter conditions.
   * @param query - Pagination parameters.
   * @returns A promise that resolves to the matching records and total count.
   */
  private async _paginate(
    where: Prisma.ApplicationWhereInput,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResult> {
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
