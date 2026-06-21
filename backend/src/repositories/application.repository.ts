import { APPLICATION_TYPES, PAID_LEAVE_TYPES } from "@/configs/entities/attendance.config.ts"
import {
  IApplicationRepository,
  ILeaveType,
  IListApplicationsQueryDTO,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"

import { ApplicationStatus, ApplicationType, AttendanceStatus, PrismaClient } from "@prisma/client"

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

  /**
   * Creates and submits a new application with the correct detail relation in a single query.
   *
   * @param data - The application details and parameters.
   * @returns A promise that resolves to the newly created application with all included relations.
   */
  async submit(data: ISubmitApplicationDTO): Promise<any> {
    const { employeeId, type, startDate, endDate, reason, note, assignedToId, detail } = data

    return this.prisma.application.create({
      data: {
        employeeId,
        type: type as ApplicationType,
        status: ApplicationStatus.pending,
        startDate: new Date(startDate),
        endDate: new Date(endDate ?? startDate),
        reason,
        note,
        assignedToId: assignedToId ?? null,
        ...this._buildDetailCreate(data),
      },
      include: APPLICATION_INCLUDE,
    })
  }

  /**
   * Finds a single application by its unique identifier.
   *
   * @param id - The application ID.
   * @returns A promise that resolves to the application details or null if not found.
   */
  async findById(id: string): Promise<any | null> {
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
  ): Promise<{ data: any[]; total: number }> {
    const where = this._buildWhere({ ...query, employeeId })
    return this._paginate(where, query)
  }

  /**
   * Retrieves a paginated list of all applications in the database, with filters.
   *
   * @param query - The pagination and filter parameters.
   * @returns A promise that resolves to the matching applications and total count.
   */
  async findAll(query: IListApplicationsQueryDTO): Promise<{ data: any[]; total: number }> {
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

  /**
   * Approves a pending application and records the approving processor.
   * Also executes necessary side-effects (like swapping shifts).
   *
   * @param id - The application ID.
   * @param approvedBy - The ID of the processor approving the application.
   * @returns A promise that resolves to the updated application, or null if update failed.
   */
  async approve(id: string, approvedBy: string): Promise<any | null> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // 1. Fetch application to check type and details
          const app = await tx.application.findUnique({
            where: { id, status: ApplicationStatus.pending },
            include: APPLICATION_INCLUDE,
          })

        if (!app) return null

        // 2. Execute side-effects
        if (app.type === ApplicationType.shift_swap && app.shiftSwapDetail) {
          const detail = app.shiftSwapDetail
          if (detail.swapWithShiftId && detail.swapWithEmployeeId) {
            // Swapping two existing employee shifts
            const shift1 = await tx.employeeShift.findUnique({
              where: { id: detail.employeeShiftId },
            })
            const shift2 = await tx.employeeShift.findUnique({
              where: { id: detail.swapWithShiftId },
            })

            if (shift1 && shift2) {
              const tempDate = new Date(Date.now() + 1000000 + (Date.now() % 100000))
              // Step 1: Move shift1 to a temp date to avoid unique constraint violations [employeeId, assignedDate]
              await tx.employeeShift.update({
                where: { id: shift1.id },
                data: { assignedDate: tempDate },
              })
              // Step 2: Update shift2 with shift1's original shiftId and date
              await tx.employeeShift.update({
                where: { id: shift2.id },
                data: { shiftId: shift1.shiftId, assignedDate: shift1.assignedDate },
              })
              // Step 3: Update shift1 with shift2's original shiftId and date
              await tx.employeeShift.update({
                where: { id: shift1.id },
                data: { shiftId: shift2.shiftId, assignedDate: shift2.assignedDate },
              })
            }
          } else if (detail.workingShiftId) {
            // Swapping to a different working shift on the same day
            await tx.employeeShift.update({
              where: { id: detail.employeeShiftId },
              data: { shiftId: detail.workingShiftId },
            })
          }
        } else if (app.type === ApplicationType.overtime && app.overtimeDetail) {
          const detail = app.overtimeDetail
          const start = new Date(app.startDate).getTime()
          const end = new Date(app.endDate).getTime()
          const minutes = Math.max(0, Math.round((end - start) / 60000))

          if (minutes > 0) {
            const shift = await tx.employeeShift.findUnique({
              where: { id: detail.employeeShiftId },
            })
            if (shift) {
              await tx.attendanceRecord.upsert({
                where: { employeeShiftId: shift.id },
                create: {
                  employeeId: shift.employeeId,
                  employeeShiftId: shift.id,
                  date: shift.assignedDate,
                  status: AttendanceStatus.overtime,
                  overtimeMinutes: minutes,
                },
                update: {
                  overtimeMinutes: { increment: minutes },
                },
              })
            }
          }
        } else if (app.type === ApplicationType.leave || app.type === ApplicationType.work_from_home) {
          const shifts = await tx.employeeShift.findMany({
            where: {
              employeeId: app.employeeId,
              assignedDate: { gte: app.startDate, lte: app.endDate },
            },
          })
          
          for (const shift of shifts) {
            const isLeave = app.type === ApplicationType.leave
            const newStatus = isLeave ? AttendanceStatus.absent : AttendanceStatus.on_time
            const leaveTypeStr = app.leaveDetail?.leaveType || ""
            const newNote = isLeave ? `Nghỉ phép có phê duyệt: ${leaveTypeStr}` : "WFH có phê duyệt"
            
            await tx.attendanceRecord.upsert({
              where: { employeeShiftId: shift.id },
              create: {
                employeeId: shift.employeeId,
                employeeShiftId: shift.id,
                date: shift.assignedDate,
                status: newStatus,
                note: newNote,
              },
              update: {
                status: newStatus,
                note: newNote,
              }
            })
          }
        } else if (app.type === ApplicationType.late_early && app.lateEarlyDetail) {
          const detail = app.lateEarlyDetail
          const shift = await tx.employeeShift.findUnique({
            where: { id: detail.employeeShiftId },
          })
          if (shift) {
            const noteText = `Được duyệt ${detail.isLate ? "đi muộn" : "về sớm"}: ${detail.durationMinutes} phút`
            await tx.attendanceRecord.upsert({
              where: { employeeShiftId: shift.id },
              create: {
                employeeId: shift.employeeId,
                employeeShiftId: shift.id,
                date: shift.assignedDate,
                status: AttendanceStatus.on_time,
                note: noteText,
              },
              update: {
                note: noteText,
              }
            })
          }
        } else if (app.type === ApplicationType.resignation) {
          await tx.employee.update({
            where: { id: app.employeeId },
            data: {
              status: "inactive",
              endDate: app.endDate,
              deletedAt: app.endDate // soft delete
            }
          })
          
          await tx.projectMember.updateMany({
            where: { employeeId: app.employeeId, removedAt: null },
            data: { removedAt: app.endDate }
          })
          
          await tx.employeeShift.updateMany({
            where: { employeeId: app.employeeId, assignedDate: { gt: app.endDate } },
            data: { status: "cancelled" }
          })
        }

          // 3. Update application status
          return await tx.application.update({
            where: { id },
            data: {
              status: ApplicationStatus.approved,
              approvedById: approvedBy,
              approvedAt: new Date(),
              rejectReason: null,
            },
            include: APPLICATION_INCLUDE,
          })
        },
        { timeout: 15000, maxWait: 15000 }
      )
    } catch (err) {
      console.error("[ApplicationRepository.approve] Failed:", err)
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
  async reject(id: string, rejectedBy: string, rejectReason: string): Promise<any | null> {
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

  /**
   * Constructs the nested detail creation payload for Prisma based on the application type.
   *
   * @param data - The application submission DTO.
   * @returns The Prisma nested write object for details.
   */
  private _buildDetailCreate(data: ISubmitApplicationDTO): Record<string, any> {
    switch (data.type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        return {
          leaveDetail: {
            create: {
              leaveType: data.detail.leaveType,
              regimeType: data.detail.regimeType,
            },
          },
        }

      case APPLICATION_TYPES.OVERTIME.LABEL:
        return {
          overtimeDetail: {
            create: { employeeShiftId: data.detail.employeeShiftId },
          },
        }

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        return {
          workFromHomeDetail: {
            create: { location: data.detail?.location },
          },
        }

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
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

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        return {
          lateEarlyDetail: {
            create: {
              employeeShiftId: data.detail.employeeShiftId,
              durationMinutes: data.detail.durationMinutes,
              isLate: data.detail.isLate,
            },
          },
        }

      case APPLICATION_TYPES.RESIGNATION.LABEL:
        return {}

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
  private _buildWhere(query: IListApplicationsQueryDTO & { employeeId?: string; keyword?: string }) {
    const where: Record<string, any> = {}

    if (query.employeeId) where.employeeId = query.employeeId
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.startDate || query.endDate) {
      where.startDate = {}
      if (query.startDate) where.startDate.gte = new Date(query.startDate)
      if (query.endDate) where.startDate.lte = new Date(query.endDate)
    }

    if (query.keyword) {
      const kw = query.keyword
      where.OR = [
        { id: { contains: kw, mode: "insensitive" } },
        { employee: { fullName: { contains: kw, mode: "insensitive" } } },
        { employee: { id: { contains: kw, mode: "insensitive" } } },
        { approvedBy: { fullName: { contains: kw, mode: "insensitive" } } }
      ]
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
