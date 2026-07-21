import { jobRequisitionRepository } from "@/repositories/job-requisition.repository"
import type {
  CreateJobRequisitionInput,
  UpdateJobRequisitionInput,
  ApproveRequisitionInput,
  ListRequisitionsQuery,
} from "@/types/recruitment.types"
import { REQUISITION_STATUS } from "@/configs/entities/recruitment.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { AppError } from "@/utils/error.util"

export class JobRequisitionService {
  async create(input: CreateJobRequisitionInput, requestedById: string) {
    // Validate salary range
    if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
      throw new Error("Minimum salary cannot exceed maximum salary")
    }

    await this.assertEligibleApprover(input.approverId)

    return jobRequisitionRepository.create(input, requestedById)
  }

  async findById(id: string) {
    const requisition = await jobRequisitionRepository.findById(id)
    if (!requisition) {
      throw new Error("Job requisition not found")
    }
    return requisition
  }

  async findByCode(code: string) {
    const requisition = await jobRequisitionRepository.findByCode(code)
    if (!requisition) {
      throw new Error("Job requisition not found")
    }
    return requisition
  }

  async list(query: ListRequisitionsQuery) {
    return jobRequisitionRepository.list(query)
  }

  async update(id: string, input: UpdateJobRequisitionInput) {
    const existing = await this.findById(id)

    // Prevent updates to closed requisitions
    if (existing.status === REQUISITION_STATUS.CLOSED || existing.status === REQUISITION_STATUS.FILLED) {
      throw new Error("Cannot update closed or filled requisitions")
    }

    // Validate salary range
    if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
      throw new Error("Minimum salary cannot exceed maximum salary")
    }

    if (input.approverId) await this.assertEligibleApprover(input.approverId)

    // Only draft requisitions can update most fields
    if (existing.status !== REQUISITION_STATUS.DRAFT && input.status === undefined) {
      throw new Error("Only draft requisitions can be updated")
    }

    return jobRequisitionRepository.update(id, input)
  }

  async submitForApproval(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== REQUISITION_STATUS.DRAFT) {
      throw new Error("Only draft requisitions can be submitted for approval")
    }

    if (!existing.approverId) {
      throw new AppError(
        "Yêu cầu tuyển dụng chưa được chỉ định người duyệt",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
        "REQUISITION_APPROVER_REQUIRED",
      )
    }
    await this.assertEligibleApprover(existing.approverId)

    return jobRequisitionRepository.update(id, { status: REQUISITION_STATUS.PENDING_APPROVAL })
  }

  async approve(id: string, input: ApproveRequisitionInput, approverId: string) {
    const existing = await this.findById(id)

    if (existing.status !== REQUISITION_STATUS.PENDING_APPROVAL) {
      throw new Error("Only pending requisitions can be approved")
    }

    if (existing.approverId !== approverId) {
      throw new AppError("Bạn không phải người được chỉ định duyệt yêu cầu này", HttpStatusCode.FORBIDDEN, "SERVICE")
    }

    if (!input.approved) {
      return jobRequisitionRepository.reject(id, approverId, input.comment)
    }

    return jobRequisitionRepository.approve(id, approverId, input.comment)
  }

  async close(id: string) {
    const existing = await this.findById(id)

    if (existing.status === REQUISITION_STATUS.CLOSED || existing.status === REQUISITION_STATUS.FILLED) {
      throw new Error("Requisition is already closed")
    }

    return jobRequisitionRepository.close(id)
  }

  async markAsFilled(id: string) {
    const existing = await this.findById(id)

    if (existing.status === REQUISITION_STATUS.FILLED) {
      throw new Error("Requisition is already filled")
    }

    return jobRequisitionRepository.update(id, { status: REQUISITION_STATUS.FILLED })
  }

  async incrementFilledCount(id: string) {
    return jobRequisitionRepository.incrementFilledCount(id)
  }

  private async assertEligibleApprover(approverId: string) {
    if (!(await jobRequisitionRepository.canApprove(approverId))) {
      throw new AppError(
        "Người được chọn không có quyền duyệt yêu cầu tuyển dụng",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
        "INVALID_REQUISITION_APPROVER",
      )
    }
  }

  async delete(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== REQUISITION_STATUS.DRAFT) {
      throw new Error("Only draft requisitions can be deleted")
    }

    return jobRequisitionRepository.delete(id)
  }

  async getStats() {
    return jobRequisitionRepository.getStats()
  }

  async listApprovers() {
    return jobRequisitionRepository.listApprovers()
  }
}

export const jobRequisitionService = new JobRequisitionService()
