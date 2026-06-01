import { EmployeeShiftDocument } from "@/entities/attendance/EmployeeShift.ts"
import { IEmployeeShiftRepository, IOverrideEmployeeShiftDTO } from "@/types/shift.types.ts"

import { Model } from "mongoose"

export class MongoEmployeeShiftRepository implements IEmployeeShiftRepository {
  constructor(private employeeShiftModel: Model<EmployeeShiftDocument>) {}

  async overrideShift(data: IOverrideEmployeeShiftDTO): Promise<any> {
    // Find if already exists, else create
    const { employeeId, assignedDate, shiftId } = data

    // Normalize date to start of day for accurate overriding
    const startOfDay = new Date(assignedDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(assignedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const updated = await this.employeeShiftModel
      .findOneAndUpdate(
        {
          employeeId,
          assignedDate: { $gte: startOfDay, $lte: endOfDay },
        },
        {
          $set: {
            shiftId,
            assignedDate: startOfDay,
            isOverride: true,
            status: "scheduled",
          },
        },
        { new: true, upsert: true },
      )
      .lean()

    return updated
  }

  async getShiftForEmployeeDate(employeeId: string, date: string | Date): Promise<any | null> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return this.employeeShiftModel
      .findOne({
        employeeId,
        assignedDate: { $gte: startOfDay, $lte: endOfDay },
      })
      .lean()
  }
}
