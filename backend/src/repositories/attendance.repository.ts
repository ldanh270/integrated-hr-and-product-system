import { AttendanceRecordDocument } from "@/entities/attendance/AttendanceRecord.ts"
import {
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IGpsScanDTO,
} from "@/types/attendance.types.ts"

import { Model } from "mongoose"

import { BaseRepository } from "./base.repository.ts"

export class MongoAttendanceRepository
  extends BaseRepository<AttendanceRecordDocument>
  implements IAttendanceRepository
{
  constructor(attendanceModel: Model<AttendanceRecordDocument>) {
    super(attendanceModel)
  }

  async checkIn(employeeId: string, location: IGpsScanDTO, shiftId?: string): Promise<any> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find if record already exists for today, else create
    const record = await this.model
      .findOneAndUpdate(
        {
          employeeId: { $eq: employeeId },
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
    const record = await this.model
      .findOneAndUpdate(
        {
          employeeId: { $eq: employeeId },
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

    if (query.employeeId) filter.employeeId = { $eq: query.employeeId }
    if (query.status) filter.status = { $eq: query.status }

    if (query.startDate || query.endDate) {
      filter.date = {}
      if (query.startDate) {
        const startDate = new Date(query.startDate)
        if (!Number.isNaN(startDate.getTime())) filter.date.$gte = startDate
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate)
        if (!Number.isNaN(endDate.getTime())) filter.date.$lte = endDate
      }
    }

    return this.model.find(filter).sort({ date: -1 }).lean()
  }
}
