import { WorkingShiftDocument } from "@/entities/attendance/WorkingShift.ts"
import {
  ICreateWorkingShiftDTO,
  IUpdateWorkingShiftDTO,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"

import { Model } from "mongoose"

export class MongoWorkingShiftRepository implements IWorkingShiftRepository {
  constructor(private workingShiftModel: Model<WorkingShiftDocument>) {}

  async create(data: ICreateWorkingShiftDTO): Promise<any> {
    const shift = new this.workingShiftModel(data)
    const saved = await shift.save()
    return saved.toObject()
  }

  async update(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null> {
    const updated = await this.workingShiftModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()

    return updated
  }

  async findById(id: string): Promise<any | null> {
    return this.workingShiftModel.findById(id).lean()
  }

  async listAll(): Promise<any[]> {
    return this.workingShiftModel.find().lean()
  }
}
