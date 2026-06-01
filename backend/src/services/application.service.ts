import { IApplicationStatus } from "@/configs/entities/attendance.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  IApplicationRepository,
  IApplicationService,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

export class ApplicationService implements IApplicationService {
  constructor(private applicationRepo: IApplicationRepository) {}

  async submitApplication(data: ISubmitApplicationDTO): Promise<any> {
    // Optionally validate overlap or balances here before submitting
    return this.applicationRepo.submit(data)
  }

  async processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<any | null> {
    const updated = await this.applicationRepo.approve(id, status, processorId)
    if (!updated) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service")
    }
    return updated
  }

  async getEmployeeApplications(employeeId: string): Promise<any[]> {
    return this.applicationRepo.findByEmployee(employeeId)
  }
}
