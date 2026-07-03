import { IEmployeeShiftRepository, IEmployeeShiftWithShift, IOverrideEmployeeShiftDTO } from "@/types/shift.types.ts"

import { EmployeeShift, PrismaClient, ShiftStatus } from "@prisma/client"

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
  async createOverrideShift(data: IOverrideEmployeeShiftDTO): Promise<EmployeeShift> {
    const { employeeId, assignedDate, shiftId, createdById } = data
    const date = new Date(assignedDate)
    date.setHours(0, 0, 0, 0)
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
  async overrideShift(data: IOverrideEmployeeShiftDTO): Promise<EmployeeShift> {
    const { employeeId, assignedDate, shiftId, createdById } = data
    const date = new Date(assignedDate)
    date.setHours(0, 0, 0, 0)
    const actorId = createdById ?? employeeId

    // Multi-slot schema: no longer unique on [employeeId, assignedDate] alone.
    const existing = await this.prisma.employeeShift.findFirst({
      where: {
        employeeId,
        assignedDate: date,
        isOverride: true,
      },
      orderBy: { createdAt: "asc" },
    })

    if (existing) {
      return this.prisma.employeeShift.update({
        where: { id: existing.id },
        data: {
          shiftId,
          isOverride: true,
          status: ShiftStatus.scheduled,
        },
      })
    } else {
      // Need createdById if creating a new shift...
      // Since it's missing in DTO, we might just fail or use a system placeholder if allowed.
      // Assuming employeeId is acting as creator or we require createdById in override
      return this.prisma.employeeShift.create({
        data: {
          employeeId,
          assignedDate: date,
          shiftId,
          isOverride: true,
          status: ShiftStatus.scheduled,
          createdById: actorId, // fallback
        },
      })
    }
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

    // Multiple shifts per day (PT assign) — prefer admin override, earliest start first.
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
  ): Promise<any> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const existing = await this.prisma.employeeShift.findFirst({
      where: {
        employeeId,
        assignedDate: targetDate,
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
