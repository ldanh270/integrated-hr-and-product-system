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
      throw new AppError(
        "Lương tối thiểu không được lớn hơn lương tối đa",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    await this.assertEligibleApprover(input.approverId)

    return jobRequisitionRepository.create(input, requestedById)
  }

  async findById(id: string) {
    const requisition = await jobRequisitionRepository.findById(id)
    if (!requisition) {
      throw new AppError(
        "Không tìm thấy yêu cầu tuyển dụng",
        HttpStatusCode.NOT_FOUND,
        "JobRequisitionService",
      )
    }
    return requisition
  }

  async findByCode(code: string) {
    const requisition = await jobRequisitionRepository.findByCode(code)
    if (!requisition) {
      throw new AppError(
        "Không tìm thấy yêu cầu tuyển dụng",
        HttpStatusCode.NOT_FOUND,
        "JobRequisitionService",
      )
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
      throw new AppError(
        "Không thể chỉnh sửa yêu cầu tuyển dụng đã đóng hoặc đã tuyển đủ",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    // Validate salary range
    if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
      throw new AppError(
        "Lương tối thiểu không được lớn hơn lương tối đa",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    if (input.approverId) await this.assertEligibleApprover(input.approverId)

    // Only draft and pending approval requisitions can update most fields
    const updatesCandidateSchemaOnly = Object.keys(input).every((field) => field === "candidateSchema")
    if (
      existing.status !== REQUISITION_STATUS.DRAFT &&
      existing.status !== REQUISITION_STATUS.PENDING_APPROVAL &&
      input.status === undefined &&
      !updatesCandidateSchemaOnly
    ) {
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng nháp hoặc chờ duyệt mới được chỉnh sửa",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    return jobRequisitionRepository.update(id, input)
  }

  async submitForApproval(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== REQUISITION_STATUS.DRAFT) {
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng nháp mới được gửi duyệt",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
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
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng đang chờ duyệt mới được duyệt",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
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
      throw new AppError(
        "Yêu cầu tuyển dụng đã đóng",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    return jobRequisitionRepository.close(id)
  }

  async markAsFilled(id: string) {
    const existing = await this.findById(id)

    if (existing.status === REQUISITION_STATUS.FILLED) {
      throw new AppError(
        "Yêu cầu tuyển dụng đã tuyển đủ",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
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
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng nháp mới được xóa",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
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
