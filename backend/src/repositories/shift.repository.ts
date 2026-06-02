import { WorkingShiftDocument } from "@/entities/attendance/WorkingShift.ts"
import {
  ICreateWorkingShiftDTO,
  IUpdateWorkingShiftDTO,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"

import { Model } from "mongoose"

import { BaseRepository } from "./base.repository.ts"

export class MongoWorkingShiftRepository
  extends BaseRepository<WorkingShiftDocument>
  implements IWorkingShiftRepository
{
  constructor(workingShiftModel: Model<WorkingShiftDocument>) {
    super(workingShiftModel)
  }

  async listAll(): Promise<any[]> {
    return this.findAll()
  }
}
