import { IHolidayRepository } from "@/types/attendance.types.ts"

import { HolidayType, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaHolidayRepository extends BaseRepository implements IHolidayRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async createHoliday(name: string, date: string | Date, type: string): Promise<any> {
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
        createdById: "", // Note: we don't have createdById in arguments, we need a fallback or fix caller
      },
    })
  }

  async checkIsHoliday(date: string | Date): Promise<boolean> {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    const holiday = await this.prisma.holidayCalendar.findUnique({
      where: { date: checkDate },
    })
    return !!holiday
  }
}
