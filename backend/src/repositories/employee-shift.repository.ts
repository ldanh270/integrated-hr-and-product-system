import {
  IEmployeeShiftRepository,
  IEmployeeShiftOverrideRecord,
  IEmployeeShiftWithShift,
  IOverrideEmployeeShiftDTO,
} from "@/types/shift.types.ts"

import { PrismaClient, ShiftStatus } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for employee shift assignments using Prisma.
 */
export class PrismaEmployeeShiftRepository
  extends BaseRepository
  implements IEmployeeShiftRepository
{
  /**
   * Creates a new PrismaEmployeeShiftRepository instance.
   * @param prisma - The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /** Append-only override row — supports multiple shifts per day for part-time assign. */
  async createOverrideShift(data: IOverrideEmployeeShiftDTO): Promise<IEmployeeShiftOverrideRecord> {
    const { employeeId, assignedDate, shiftId, createdById } = data
    const date = new Date(assignedDate)
    date.setHours(0, 0, 0, 0)
    // Audit trail: admin assign passes createdById; self-service paths fall back to employee.
    const actorId = createdById ?? employeeId

    return this.prisma.employeeShift.create({
      data: {
        employeeId,
        assignedDate: date,
        shiftId,
        isOverride: true,
        status: ShiftStatus.scheduled,
        createdById: actorId,
      },
    })
  }

  /** Remove prior admin-assigned overrides for the week without touching template/schedule shifts. */
  async deleteOverridesForEmployeeDates(employeeId: string, dates: Date[]): Promise<void> {
    if (dates.length === 0) return

    const normalizedDates = dates.map((date) => {
      const next = new Date(date)
      next.setHours(0, 0, 0, 0)
      return next
    })

    await this.prisma.employeeShift.deleteMany({
      where: {
        employeeId,
        assignedDate: { in: normalizedDates },
        isOverride: true,
      },
    })
  }

  /**
   * Overrides an employee's shift for a specific date.
   * @param data - The override data.
   * @returns The updated or created employee shift.
   */
  async overrideShift(data: IOverrideEmployeeShiftDTO): Promise<IEmployeeShiftOverrideRecord> {
    const { employeeId, assignedDate, shiftId, createdById } = data
    const date = new Date(assignedDate)
    date.setHours(0, 0, 0, 0)
    // Audit trail: admin assign passes createdById; self-service paths fall back to employee.
    const actorId = createdById ?? employeeId

    // Promote existing schedule row or create override — safe under @@unique([employeeId, assignedDate, shiftId]).
    return this.prisma.employeeShift.upsert({
      where: {
        employeeId_assignedDate_shiftId: {
          employeeId,
          assignedDate: date,
          shiftId,
        },
      },
      update: {
        isOverride: true,
        status: ShiftStatus.scheduled,
      },
      create: {
        employeeId,
        assignedDate: date,
        shiftId,
        isOverride: true,
        status: ShiftStatus.scheduled,
        createdById: actorId,
      },
    })
  }

  /**
   * Gets a shift assignment for an employee on a specific date.
   * @param employeeId - The employee ID.
   * @param date - The target date.
   * @returns The employee shift assignment or null if not found.
   */
  async getShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
  ): Promise<IEmployeeShiftWithShift | null> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    // PT may have multiple shifts/day; check-in uses one row until multi-shift attendance exists.
    // Prefer admin override over template, earliest created first within same priority.
    return this.prisma.employeeShift.findFirst({
      where: {
        employeeId,
        assignedDate: targetDate,
      },
      include: { shift: true },
      orderBy: [{ isOverride: "desc" }, { createdAt: "asc" }],
    })
  }

  async listByEmployeesAndDateRange(
    employeeIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<IEmployeeShiftWithShift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    return this.prisma.employeeShift.findMany({
      where: {
        employeeId: { in: employeeIds },
        assignedDate: { gte: start, lte: end },
      },
      include: { shift: true },
    })
  }

  async ensureShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
    shiftId: string,
    createdById: string,
  ): Promise<IEmployeeShiftWithShift> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const existing = await this.prisma.employeeShift.findFirst({
      where: {
        employeeId,
        assignedDate: targetDate,
        // Template auto-fill must not touch admin PT overrides from availability assign.
        isOverride: false,
      },
      orderBy: { createdAt: "asc" },
    })

    if (existing) {
      return this.prisma.employeeShift.update({
        where: { id: existing.id },
        data: {
          shiftId,
          isOverride: false,
          status: ShiftStatus.scheduled,
        },
        include: { shift: true },
      })
    }

    return this.prisma.employeeShift.create({
      data: {
        employeeId,
        assignedDate: targetDate,
        shiftId,
        isOverride: false,
        status: ShiftStatus.scheduled,
        createdById,
      },
      include: { shift: true },
    })
  }

  async generateShiftForDate(
    employeeId: string,
    date: Date,
    shiftId: string,
    scheduleId: string | null,
    createdById: string,
  ): Promise<"created" | "updated" | "skipped"> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const existing = await this.prisma.employeeShift.findFirst({
      where: {
        employeeId,
        assignedDate: targetDate,
        // Template auto-fill must not touch admin PT overrides from availability assign.
        isOverride: false,
      },
      orderBy: { createdAt: "asc" },
    })

    if (existing?.isOverride) return "skipped"
    if (existing && existing.shiftId === shiftId) return "skipped"

    if (existing) {
      await this.prisma.employeeShift.update({
        where: { id: existing.id },
        data: {
          shiftId,
          scheduleId,
          isOverride: false,
          status: ShiftStatus.scheduled,
        },
      })
      return "updated"
    }

    await this.prisma.employeeShift.create({
      data: {
        employeeId,
        assignedDate: targetDate,
        shiftId,
        scheduleId,
        isOverride: false,
        status: ShiftStatus.scheduled,
        createdById,
      },
    })
    return "created"
  }
}
