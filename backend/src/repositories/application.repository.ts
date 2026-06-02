import { APPLICATION_STATUS } from "@/configs/entities/attendance.config.ts"
import { IApplicationStatus } from "@/configs/entities/attendance.config.ts"
import { ApplicationDocument } from "@/entities/attendance/Application.ts"
import { IApplicationRepository, ISubmitApplicationDTO } from "@/types/attendance.types.ts"

import { Model } from "mongoose"

import { BaseRepository } from "./base.repository.ts"

export class MongoApplicationRepository
  extends BaseRepository<ApplicationDocument>
  implements IApplicationRepository
{
  constructor(applicationModel: Model<ApplicationDocument>) {
    super(applicationModel)
  }

  async submit(data: ISubmitApplicationDTO): Promise<any> {
    const app = new this.model({
      ...data,
      status: APPLICATION_STATUS.PENDING,
    })
    const saved = await app.save()
    return saved.toObject()
  }

  async approve(id: string, status: IApplicationStatus, approvedBy: string): Promise<any | null> {
    const updated = await this.model
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status,
            approvedBy,
            approvedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      )
      .lean()

    return updated
  }

  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.model.find({ employeeId }).sort({ createdAt: -1 }).lean()
  }
}
