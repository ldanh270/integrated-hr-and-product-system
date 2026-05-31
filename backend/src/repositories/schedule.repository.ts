import { Model } from "mongoose"
import { ShiftScheduleDocument } from "@/entities/attendance/ShiftSchedule.ts"
import { IShiftScheduleRepository, IAssignShiftScheduleDTO } from "@/types/shift.types.ts"

export class MongoShiftScheduleRepository implements IShiftScheduleRepository {
  constructor(private scheduleModel: Model<ShiftScheduleDocument>) {}

  async assignSchedule(data: IAssignShiftScheduleDTO): Promise<any> {
    const schedule = new this.scheduleModel(data)
    const saved = await schedule.save()
    return saved.toObject()
  }

  async getScheduleByEmployee(employeeId: string, date: string | Date): Promise<any | null> {
    // Find active schedule for the given date
    return this.scheduleModel
      .findOne({
        employeeId,
        validFrom: { $lte: new Date(date) },
        $or: [{ validTo: null }, { validTo: { $gte: new Date(date) } }],
      })
      .lean()
  }
}
