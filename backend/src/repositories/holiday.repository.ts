import {
  IHolidayRepository,
  IListHolidaysQueryDTO,
  IUpdateHolidayDTO,
  type IHolidayType,
} from "@/types/attendance.types.ts"

import { HolidayCalendar, HolidayType, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaHolidayRepository extends BaseRepository implements IHolidayRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async listHolidays(query?: IListHolidaysQueryDTO): Promise<HolidayCalendar[]> {
    const where: { date?: { gte?: Date; lte?: Date } } = {}

    if (query?.year) {
      where.date = {
        gte: new Date(query.year, 0, 1),
        lte: new Date(query.year, 11, 31),
      }
    }

    if (query?.startDate || query?.endDate) {
      where.date = {
        ...(query.startDate ? { gte: this.normalizeDate(query.startDate) } : {}),
        ...(query.endDate ? { lte: this.normalizeDate(query.endDate) } : {}),
      }
    }

    return this.prisma.holidayCalendar.findMany({
      where,
      orderBy: { date: "asc" },
    })
  }

  async createHoliday(
    name: string,
    date: string | Date,
    type: IHolidayType,
    createdById: string,
  ): Promise<HolidayCalendar> {
    const holidayDate = new Date(date)
    holidayDate.setHours(0, 0, 0, 0)

    // Using upsert based on date which is unique
    return this.prisma.holidayCalendar.upsert({
      where: { date: holidayDate },
      update: { name, type: type as HolidayType },
      create: {
        date: holidayDate,
        name,
        type: type as HolidayType,
        createdById,
      },
    })
  }

  async updateHoliday(
    id: string,
    data: IUpdateHolidayDTO,
  ): Promise<HolidayCalendar> {
    return this.prisma.holidayCalendar.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.date ? { date: this.normalizeDate(data.date) } : {}),
        ...(data.type ? { type: data.type as HolidayType } : {}),
      },
    })
  }

  async deleteHoliday(id: string): Promise<void> {
    await this.prisma.holidayCalendar.delete({ where: { id } })
  }

  async checkIsHoliday(date: string | Date): Promise<boolean> {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    const holiday = await this.prisma.holidayCalendar.findUnique({
      where: { date: checkDate },
    })
    return !!holiday
  }

  private normalizeDate(date: string | Date): Date {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    return normalizedDate
  }
}
