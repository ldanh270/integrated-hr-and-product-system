import { REQUISITION_STATUS } from "@/configs/entities/recruitment.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { jobDescriptionRepository } from "@/repositories/job-description.repository"
import { jobRequisitionRepository } from "@/repositories/job-requisition.repository"
import type {
  CreateJobDescriptionInput,
  UpdateJobDescriptionInput,
} from "@/schemas/recruitment.schema"
import { AppError } from "@/utils/error.util"

const LAYER = "JobDescriptionService"

export class JobDescriptionService {
  async create(input: CreateJobDescriptionInput) {
    const requisition = await jobRequisitionRepository.findById(input.requisitionId)
    if (!requisition) {
      throw new AppError("Không tìm thấy yêu cầu tuyển dụng", HttpStatusCode.NOT_FOUND, LAYER)
    }
    if (requisition.status !== REQUISITION_STATUS.APPROVED) {
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng đã duyệt mới được tạo JD",
        HttpStatusCode.CONFLICT,
        LAYER,
        "REQUISITION_NOT_APPROVED",
      )
    }
    this.validateSalary(input.salaryMin, input.salaryMax)
    return jobDescriptionRepository.create(input)
  }

  async findById(id: string) {
    const result = await jobDescriptionRepository.findById(id)
    if (!result) {
      throw new AppError("Không tìm thấy JD", HttpStatusCode.NOT_FOUND, LAYER)
    }
    return result
  }

  list(query: Parameters<typeof jobDescriptionRepository.list>[0]) {
    return jobDescriptionRepository.list(query)
  }

  async update(id: string, input: UpdateJobDescriptionInput) {
    await this.findById(id)
    this.validateSalary(input.salaryMin, input.salaryMax)
    return jobDescriptionRepository.update(id, input)
  }

  private validateSalary(min?: number, max?: number) {
    if (min !== undefined && max !== undefined && min > max) {
      throw new AppError(
        "Mức lương tối thiểu không được lớn hơn mức tối đa",
        HttpStatusCode.BAD_REQUEST,
        LAYER,
      )
    }
  }
}

export const jobDescriptionService = new JobDescriptionService()
