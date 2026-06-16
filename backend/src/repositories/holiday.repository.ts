import {
  IHolidayRepository,
  IListHolidaysQueryDTO,
  IUpdateHolidayDTO,
  type IHolidayType,
} from "@/types/attendance.types.ts"

import { HolidayCalendar, HolidayType, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Prisma-backed repository for holiday calendar persistence.
 */
export class PrismaHolidayRepository extends BaseRepository implements IHolidayRepository {
  /**
   * Creates a new PrismaHolidayRepository instance.
   * @param prisma - Prisma client for database access.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Finds holidays matching optional year or date-range filters.
   * @param query - Optional filter criteria.
   * @returns Holiday records ordered by date ascending.
   */
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

  /**
   * Creates or replaces a holiday on a unique date (upsert by date).
   * @param name - Display name of the holiday.
   * @param date - Holiday date.
   * @param type - Holiday category.
   * @param createdById - Employee ID of the creator.
   * @returns The persisted holiday record.
   */
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

  /**
   * Updates an existing holiday record by ID.
   * @param id - Holiday record ID.
   * @param data - Partial fields to update.
   * @returns The updated holiday record.
   */
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

  /**
   * Deletes a holiday record by ID.
   * @param id - Holiday record ID.
   */
  async deleteHoliday(id: string): Promise<void> {
    await this.prisma.holidayCalendar.delete({ where: { id } })
  }

  /**
   * Checks whether a date exists in the holiday calendar.
   * @param date - Date to evaluate.
   * @returns True when a holiday is configured for that date.
   */
  async checkIsHoliday(date: string | Date): Promise<boolean> {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    const holiday = await this.prisma.holidayCalendar.findUnique({
      where: { date: checkDate },
    })
    return !!holiday
  }

  /** Strips time component so holiday lookups compare calendar dates only. */
  private normalizeDate(date: string | Date): Date {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    return normalizedDate
  }
}
