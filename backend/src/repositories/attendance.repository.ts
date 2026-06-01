import { IAttendanceStatus } from "@/configs/entities.config.ts"
import { AttendanceRecordDocument } from "@/entities/attendance/AttendanceRecord.ts"
import {
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IGpsScanDTO,
} from "@/types/attendance.types.ts"

import { Model } from "mongoose"

export class MongoAttendanceRepository implements IAttendanceRepository {
  constructor(private attendanceModel: Model<AttendanceRecordDocument>) {}

  async checkIn(employeeId: string, location: IGpsScanDTO, shiftId?: string): Promise<any> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find if record already exists for today, else create
    const record = await this.attendanceModel
      .findOneAndUpdate(
        {
          employeeId,
          date: today,
        },
        {
          $setOnInsert: { shiftId }, // Only set on insert
          $set: {
            "checkIn.at": new Date(),
            "checkIn.location": location,
          },
        },
        { new: true, upsert: true },
      )
      .lean()

    return record
  }

  async checkOut(employeeId: string, location: IGpsScanDTO): Promise<any> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Update existing record
    const record = await this.attendanceModel
      .findOneAndUpdate(
        {
          employeeId,
          date: today,
        },
        {
          $set: {
            "checkOut.at": new Date(),
            "checkOut.location": location,
          },
        },
        { new: true },
      )
      .lean()

    return record
  }

  async queryRecords(query: IAttendanceRecordQueryDTO): Promise<any[]> {
    const filter: any = {}

    if (query.employeeId) filter.employeeId = query.employeeId
    if (query.status) filter.status = query.status

    if (query.startDate || query.endDate) {
      filter.date = {}
      if (query.startDate) filter.date.$gte = new Date(query.startDate)
      if (query.endDate) filter.date.$lte = new Date(query.endDate)
    }

    return this.attendanceModel.find(filter).sort({ date: -1 }).lean()
  }
}
