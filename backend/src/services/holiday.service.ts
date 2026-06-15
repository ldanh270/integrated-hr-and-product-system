import {
  IHolidayRepository,
  IHolidayService,
  IListHolidaysQueryDTO,
  IUpdateHolidayDTO,
  type IHolidayType,
} from "@/types/attendance.types.ts"

import type { HolidayCalendar } from "@prisma/client"

export class HolidayService implements IHolidayService {
  constructor(private holidayRepo: IHolidayRepository) {}

  async listHolidays(query?: IListHolidaysQueryDTO): Promise<HolidayCalendar[]> {
    return this.holidayRepo.listHolidays(query)
  }

  async createHoliday(
    name: string,
    date: string | Date,
    type: IHolidayType,
    createdById: string,
  ): Promise<HolidayCalendar> {
    return this.holidayRepo.createHoliday(name, date, type, createdById)
  }

  async updateHoliday(
    id: string,
    data: IUpdateHolidayDTO,
  ): Promise<HolidayCalendar> {
    return this.holidayRepo.updateHoliday(id, data)
  }

  async deleteHoliday(id: string): Promise<void> {
    return this.holidayRepo.deleteHoliday(id)
  }

  async isHoliday(date: string | Date): Promise<boolean> {
    return this.holidayRepo.checkIsHoliday(date)
  }
}
