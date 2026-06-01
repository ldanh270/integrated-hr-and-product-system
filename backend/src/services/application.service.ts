import { IApplicationStatus } from "@/configs/entities.config.ts"
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
      throw new AppError("Application not found", 404, "Service")
    }
    return updated
  }

  async getEmployeeApplications(employeeId: string): Promise<any[]> {
    return this.applicationRepo.findByEmployee(employeeId)
  }
}
