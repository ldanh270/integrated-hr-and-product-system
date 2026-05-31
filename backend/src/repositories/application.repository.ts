import { Model } from "mongoose"
import { ApplicationDocument } from "@/entities/attendance/Application.ts"
import { IApplicationRepository, ISubmitApplicationDTO } from "@/types/attendance.types.ts"
import { IApplicationStatus } from "@/configs/constants/entities.config.ts"

export class MongoApplicationRepository implements IApplicationRepository {
  constructor(private applicationModel: Model<ApplicationDocument>) {}

  async submit(data: ISubmitApplicationDTO): Promise<any> {
    const app = new this.applicationModel({
      ...data,
      status: "pending"
    })
    const saved = await app.save()
    return saved.toObject()
  }

  async approve(id: string, status: IApplicationStatus, approvedBy: string): Promise<any | null> {
    const updated = await this.applicationModel
      .findByIdAndUpdate(
        id, 
        { 
          $set: { 
            status, 
            approvedBy, 
            approvedAt: new Date() 
          } 
        }, 
        { new: true }
      )
      .lean()
      
    return updated
  }

  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.applicationModel
      .find({ employeeId })
      .sort({ createdAt: -1 })
      .lean()
  }
}
