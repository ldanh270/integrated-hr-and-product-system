import { IAssignShiftScheduleDTO, IShiftScheduleRepository } from "@/types/shift.types.ts"

import { PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaShiftScheduleRepository
  extends BaseRepository
  implements IShiftScheduleRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

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
