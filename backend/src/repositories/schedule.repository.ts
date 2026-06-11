import { IAssignShiftScheduleDTO, IShiftScheduleRepository } from "@/types/shift.types.ts"

import { PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for recurring shift schedules using Prisma.
 */
export class PrismaShiftScheduleRepository
  extends BaseRepository
  implements IShiftScheduleRepository
{
  /**
   * Creates a new PrismaShiftScheduleRepository instance.
   * @param prisma - The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Assigns a recurring shift schedule to an employee.
   * @param data - The schedule assignment data.
   * @returns The created shift schedule.
   */
  async assignSchedule(data: IAssignShiftScheduleDTO): Promise<any> {
    const { employeeId, validFrom, validTo, days, createdById } = data

    return this.prisma.shiftSchedule.create({
      data: {
        employeeId,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : undefined,
        createdById,
        days: days
          ? {
              create: days.map((day) => ({
                dayOfWeek: day.dayOfWeek,
                shiftId: day.shiftId,
              })),
            }
          : undefined,
      },
      include: {
        days: {
          include: { shift: true },
        },
      },
    })
  }

  /**
   * Gets the active shift schedule for an employee on a specific date.
   * @param employeeId - The employee ID.
   * @param date - The target date.
   * @returns The active shift schedule or null if not found.
   */
  async getScheduleByEmployee(employeeId: string, date: string | Date): Promise<any | null> {
    const targetDate = new Date(date)
    return this.prisma.shiftSchedule.findFirst({
      where: {
        employeeId,
        validFrom: { lte: targetDate },
        OR: [{ validTo: null }, { validTo: { gte: targetDate } }],
      },
      include: {
        days: {
          include: { shift: true },
        },
      },
      orderBy: { validFrom: "desc" },
    })
  }

  /**
   * Lists all shift schedules for an employee.
   * @param employeeId - The employee ID.
   * @returns An array of shift schedules.
   */
  async listSchedulesByEmployee(employeeId: string): Promise<any[]> {
    return this.prisma.shiftSchedule.findMany({
      where: { employeeId },
      include: {
        days: {
          include: { shift: true },
        },
      },
      orderBy: { validFrom: "desc" },
    })
  }
}
