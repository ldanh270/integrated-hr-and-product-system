import { recruitmentApplicationRepository } from "@/repositories/recruitment-application.repository"
import { jobRequisitionRepository } from "@/repositories/job-requisition.repository"
import type {
  CreateApplicationInput,
  UpdateApplicationStatusInput,
  ListApplicationsQuery,
} from "@/types/recruitment.types"
import { canTransitionApplicationStatus } from "@/configs/rules/recruitment.config"
import { TERMINAL_APPLICATION_STATUSES } from "@/configs/entities/recruitment.config"
import { jobRequisitionService } from "./job-requisition.service"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import { HttpStatusCode } from "@/configs/system/http.config"
import { AppError } from "@/utils/error.util"

const LAYER = "RecruitmentApplicationService"

export class RecruitmentApplicationService {
  async create(input: CreateApplicationInput) {
    let normalizedInput = input
    // Check if requisition exists and is approved
    const requisition = await jobRequisitionRepository.findById(input.requisitionId)
    if (!requisition) {
      throw new Error("Job requisition not found")
    }
    if (requisition.status !== "approved") {
      throw new Error("Cannot apply to unapproved requisitions")
    }

    if (input.postingId) {
      const posting = await jobPostingRepository.findById(input.postingId)
      if (!posting || posting.requisitionId !== input.requisitionId) {
        throw new AppError(
          "Bài đăng không thuộc Yêu cầu tuyển dụng đã chọn",
          HttpStatusCode.BAD_REQUEST,
          LAYER,
          "POSTING_REQUISITION_MISMATCH",
        )
      }
      if (posting.source !== input.source) {
        throw new AppError(
          "Nguồn ứng viên không khớp bài đăng",
          HttpStatusCode.BAD_REQUEST,
          LAYER,
          "POSTING_SOURCE_MISMATCH",
        )
      }
      normalizedInput = { ...input, sourceRef: posting.sourceCode }
    }

    const duplicate = await recruitmentApplicationRepository.findActive(
      input.requisitionId,
      input.candidateId,
      [...TERMINAL_APPLICATION_STATUSES],
    )
    if (duplicate) {
      throw new Error("Candidate has already applied to this requisition")
    }

    return recruitmentApplicationRepository.create(normalizedInput)
  }

  async findById(id: string) {
    const application = await recruitmentApplicationRepository.findById(id)
    if (!application) {
      throw new Error("Application not found")
    }
    return application
  }

  async list(query: ListApplicationsQuery) {
    return recruitmentApplicationRepository.list(query)
  }

  async listKanban(query: ListApplicationsQuery) {
    return recruitmentApplicationRepository.listKanban(query)
  }

  async updateStatus(id: string, input: UpdateApplicationStatusInput) {
    const application = await this.findById(id)

    // Validate status transition
    if (!canTransitionApplicationStatus(application.status, input.status)) {
      throw new Error(
        `Invalid status transition from '${application.status}' to '${input.status}'`
      )
    }

    const result = await recruitmentApplicationRepository.updateStatus(id, input)

    // Auto-update requisition filled count if hired
    if (input.status === "hired") {
      await jobRequisitionService.incrementFilledCount(application.requisitionId)
    }

    return result
  }

  async moveKanban(applicationId: string, targetStatus: string) {
    return this.updateStatus(applicationId, { status: targetStatus as any })
  }

  async assignRecruiter(id: string, assignedToId: string) {
    await this.findById(id) // Validate exists
    return recruitmentApplicationRepository.assignRecruiter(id, assignedToId)
  }

  async addNote(id: string, note: string, addedById: string) {
    await this.findById(id) // Validate exists
    return recruitmentApplicationRepository.addNote(id, note, addedById)
  }

  async getNotes(id: string) {
    await this.findById(id)
    return recruitmentApplicationRepository.getNotes(id)
  }

  async delete(id: string) {
    const application = await this.findById(id)

    // Only allow deletion of terminal applications
    if (!TERMINAL_APPLICATION_STATUSES.includes(application.status as any)) {
      throw new Error("Only terminal applications can be deleted")
    }

    return recruitmentApplicationRepository.delete(id)
  }

  async getStats() {
    return recruitmentApplicationRepository.getStats()
  }
}

export const recruitmentApplicationService = new RecruitmentApplicationService()
