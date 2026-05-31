import {
  IHolidayService,
  IHolidayRepository,
} from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

export class HolidayService implements IHolidayService {
  constructor(private holidayRepo: IHolidayRepository) {}

  async createHoliday(name: string, date: string | Date, type: string): Promise<any> {
    return this.holidayRepo.create(name, date, type)
  }

  async isHoliday(date: string | Date): Promise<boolean> {
    return this.holidayRepo.checkIsHoliday(date)
  }
}
