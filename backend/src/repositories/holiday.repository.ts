import { HolidayCalendarDocument } from "@/entities/attendance/HolidayCalendar.ts"
import { IHolidayRepository } from "@/types/attendance.types.ts"

import { Model } from "mongoose"

import { BaseRepository } from "./base.repository.ts"

export class MongoHolidayRepository
  extends BaseRepository<HolidayCalendarDocument>
  implements IHolidayRepository
{
  constructor(holidayModel: Model<HolidayCalendarDocument>) {
    super(holidayModel)
  }

  async createHoliday(name: string, date: string | Date, type: string): Promise<any> {
    const holidayDate = new Date(date)
    holidayDate.setHours(0, 0, 0, 0)

    // Upsert holiday
    const holiday = await this.model
      .findOneAndUpdate(
        { date: holidayDate },
        { $set: { name, type } },
        { new: true, upsert: true },
      )
      .lean()

    return holiday
  }

  async checkIsHoliday(date: string | Date): Promise<boolean> {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    const holiday = await this.model.exists({ date: checkDate })
    return holiday !== null
  }
}
