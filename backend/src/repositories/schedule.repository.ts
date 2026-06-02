import { ShiftScheduleDocument } from "@/entities/attendance/ShiftSchedule.ts"
import { IAssignShiftScheduleDTO, IShiftScheduleRepository } from "@/types/shift.types.ts"

import { Model } from "mongoose"

import { BaseRepository } from "./base.repository.ts"

export class MongoShiftScheduleRepository
  extends BaseRepository<ShiftScheduleDocument>
  implements IShiftScheduleRepository
{
  constructor(scheduleModel: Model<ShiftScheduleDocument>) {
    super(scheduleModel)
  }

  async assignSchedule(data: IAssignShiftScheduleDTO): Promise<any> {
    return this.create(data)
  }

  async getScheduleByEmployee(employeeId: string, date: string | Date): Promise<any | null> {
    // Find active schedule for the given date
    return this.model
      .findOne({
        employeeId,
        validFrom: { $lte: new Date(date) },
        $or: [{ validTo: null }, { validTo: { $gte: new Date(date) } }],
      })
      .lean()
  }
}
