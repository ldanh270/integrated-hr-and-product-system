import {
  IHolidayRepository,
  IHolidayService,
  IListHolidaysQueryDTO,
  IUpdateHolidayDTO,
  type IHolidayType,
} from "@/types/attendance.types.ts"

import type { HolidayCalendar } from "@prisma/client"

/**
 * Service for holiday calendar operations used by attendance scheduling.
 */
export class HolidayService implements IHolidayService {
  /**
   * Creates a new HolidayService instance.
   * @param holidayRepo - Repository for holiday calendar data.
   */
  constructor(private holidayRepo: IHolidayRepository) {}

  /**
   * Lists holidays matching optional year or date-range filters.
   * @param query - Optional filter criteria.
   * @returns Holiday records ordered by date.
   */
  async listHolidays(query?: IListHolidaysQueryDTO): Promise<HolidayCalendar[]> {
    return this.holidayRepo.listHolidays(query)
  }

  /**
   * Creates or updates a holiday on the given date.
   * @param name - Display name of the holiday.
   * @param date - Holiday date.
   * @param type - Holiday category (national or company).
   * @param createdById - Employee ID of the creator.
   * @returns The persisted holiday record.
   */
  async createHoliday(
    name: string,
    date: string | Date,
    type: IHolidayType,
    createdById: string,
  ): Promise<HolidayCalendar> {
    return this.holidayRepo.createHoliday(name, date, type, createdById)
  }

  /**
   * Updates an existing holiday record.
   * @param id - Holiday record ID.
   * @param data - Partial fields to update.
   * @returns The updated holiday record.
   */
  async updateHoliday(
    id: string,
    data: IUpdateHolidayDTO,
  ): Promise<HolidayCalendar> {
    return this.holidayRepo.updateHoliday(id, data)
  }

  /**
   * Deletes a holiday by ID.
   * @param id - Holiday record ID.
   */
  async deleteHoliday(id: string): Promise<void> {
    return this.holidayRepo.deleteHoliday(id)
  }

  /**
   * Checks whether a date exists in the holiday calendar.
   * @param date - Date to evaluate.
   * @returns True when the date is a configured holiday.
   */
  async isHoliday(date: string | Date): Promise<boolean> {
    return this.holidayRepo.checkIsHoliday(date)
  }
}
