import { randomUUID } from "node:crypto"
import {
  RECRUITMENT_CHANNEL,
  RECRUITMENT_SOURCE,
  RECRUITMENT_POSTING_ACTIVITY_TYPE,
  REQUISITION_STATUS,
} from "@/configs/entities/recruitment.config"
import { GOOGLE_FORM_SOURCE_CODE_PREFIX } from "@/configs/rules/google-form.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { jobRequisitionRepository } from "@/repositories/job-requisition.repository"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import { recruitmentOAuthAccountRepository } from "@/repositories/recruitment-oauth-account.repository"
import type { CreateJobPostingInput, UpdateJobPostingInput } from "@/schemas/recruitment.schema"
import type { CreatePostingCandidateInput } from "@/schemas/recruitment.schema"
import { AppError } from "@/utils/error.util"
import { recruitmentIntakeService } from "@/services/recruitment-intake.service"
import type { ConnectorSyncResult } from "@/types/recruitment-connector.types"
import { googleFormsConnector } from "@/connectors/google-forms.connector"
import { recruitmentPostingActivityService } from "@/services/recruitment-posting-activity.service"
import { recruitmentApplicationRepository } from "@/repositories/recruitment-application.repository"

const LAYER = "JobPostingService"
export interface RecruitmentConnector {
  publish(postingId: string): Promise<{ externalId: string; postingUrl: string }>
  sync(postingId: string): Promise<ConnectorSyncResult>
}

export class JobPostingService {
  private readonly syncingPostingIds = new Set<string>()
  constructor(
    private readonly connectors: ReadonlyMap<string, RecruitmentConnector> = new Map(),
  ) {}

  async create(input: CreateJobPostingInput, actorId: string) {
    const requisition = await jobRequisitionRepository.findById(input.requisitionId)
    if (!requisition) throw new AppError("Không tìm thấy yêu cầu tuyển dụng", HttpStatusCode.NOT_FOUND, LAYER)
    if (requisition.status !== REQUISITION_STATUS.APPROVED) {
      throw new AppError(
        "Không thể tạo bài đăng cho yêu cầu chưa được duyệt",
        HttpStatusCode.CONFLICT,
        LAYER,
      )
    }

    const channel = input.channel ?? RECRUITMENT_CHANNEL.GOOGLE_FORM
    let oauthAccountId = input.oauthAccountId ?? null

    if (!oauthAccountId && channel === RECRUITMENT_CHANNEL.GOOGLE_FORM) {
      const defaultOAuth = await recruitmentOAuthAccountRepository.findFirstByChannel(RECRUITMENT_CHANNEL.GOOGLE_FORM)
      oauthAccountId = defaultOAuth?.id ?? null
    }

    const sourceCode = `${GOOGLE_FORM_SOURCE_CODE_PREFIX}_${randomUUID().replaceAll("-", "")}`
    const posting = await jobPostingRepository.create({
      requisitionId: input.requisitionId,
      channel: channel as any,
      source: RECRUITMENT_SOURCE.GOOGLE_FORM,
      sourceCode,
      formFields: input.fields as any,
      oauthAccountId,
    })
    await jobPostingRepository.createDefaultPipelineStages(posting.id)
    await recruitmentPostingActivityService.record(
      posting.id,
      RECRUITMENT_POSTING_ACTIVITY_TYPE.CREATED,
      actorId,
    )
    return posting
  }

  async findById(id: string) {
    const posting = await jobPostingRepository.findById(id)
    if (!posting) {
      throw new AppError("Không tìm thấy bài đăng tuyển", HttpStatusCode.NOT_FOUND, LAYER)
    }
    return posting
  }

  list(query: Parameters<typeof jobPostingRepository.list>[0]) {
    return jobPostingRepository.list(query)
  }

  async getOverview(id: string) {
    const overview = await jobPostingRepository.getOverview(id)
    if (!overview.posting) {
      throw new AppError("Không tìm thấy bài đăng tuyển", HttpStatusCode.NOT_FOUND, LAYER)
    }
    return overview
  }

  listActivities(id: string, page: number, pageSize: number) {
    return recruitmentPostingActivityService.list(id, page, pageSize)
  }

  async listConnectorResponses(id: string) {
    await this.findById(id)
    return jobPostingRepository.listConnectorResponses(id)
  }

  async listPipelineStages(id: string) { await this.findById(id); return jobPostingRepository.listPipelineStages(id) }

  async createPipelineStage(id: string, data: { name: string; color?: string; isDefault?: boolean; isCompleted?: boolean }, actorId: string) {
    await this.findById(id)
    const stage = await jobPostingRepository.createPipelineStage(id, data)
    await recruitmentPostingActivityService.record(id, RECRUITMENT_POSTING_ACTIVITY_TYPE.STAGE_CREATED, actorId, { stageId: stage.id, name: stage.name })
    return stage
  }

  async updatePipelineStage(postingId: string, stageId: string, data: { name?: string; color?: string; isDefault?: boolean; isCompleted?: boolean }, actorId: string) {
    const stage = await this.getPostingStage(postingId, stageId)
    if (stage.isDefault && data.isDefault === false) {
      throw new AppError("Cần chọn một giai đoạn mặc định khác trước", HttpStatusCode.CONFLICT, LAYER, "DEFAULT_STAGE_REQUIRED")
    }
    const updated = await jobPostingRepository.updatePipelineStage(stageId, data)
    await recruitmentPostingActivityService.record(postingId, RECRUITMENT_POSTING_ACTIVITY_TYPE.STAGE_UPDATED, actorId, { stageId, fields: Object.keys(data) })
    return updated
  }

  async deletePipelineStage(postingId: string, stageId: string, fallbackStageId: string, actorId: string) {
    const stages = await this.listPipelineStages(postingId)
    const stage = stages.find((item) => item.id === stageId)
    const fallback = stages.find((item) => item.id === fallbackStageId)
    if (!stage || !fallback || stageId === fallbackStageId) {
      throw new AppError("Giai đoạn thay thế không hợp lệ", HttpStatusCode.BAD_REQUEST, LAYER, "INVALID_STAGE_FALLBACK")
    }
    if (stage.isDefault) {
      throw new AppError("Không thể xóa giai đoạn mặc định", HttpStatusCode.CONFLICT, LAYER, "DEFAULT_STAGE_DELETE")
    }
    if (stages.length < 2) {
      throw new AppError("Bài đăng phải có ít nhất một giai đoạn", HttpStatusCode.CONFLICT, LAYER, "LAST_STAGE_DELETE")
    }
    await jobPostingRepository.deletePipelineStage(stageId, fallbackStageId)
    await recruitmentPostingActivityService.record(postingId, RECRUITMENT_POSTING_ACTIVITY_TYPE.STAGE_DELETED, actorId, { stageId, fallbackStageId, name: stage.name })
  }

  async reorderPipelineStages(postingId: string, stageIds: string[], actorId: string) {
    await this.findById(postingId)
    const stages = await jobPostingRepository.reorderPipelineStages(postingId, stageIds)
    await recruitmentPostingActivityService.record(postingId, RECRUITMENT_POSTING_ACTIVITY_TYPE.STAGES_REORDERED, actorId, { stageIds })
    return stages
  }

  async moveApplicationToPipelineStage(postingId: string, applicationId: string, pipelineStageId: string, actorId: string) {
    const application = await recruitmentApplicationRepository.findById(applicationId)
    if (!application || application.postingId !== postingId) {
      throw new AppError("Ứng viên không thuộc bài đăng này", HttpStatusCode.BAD_REQUEST, LAYER, "APPLICATION_POSTING_MISMATCH")
    }
    await this.getPostingStage(postingId, pipelineStageId)
    const updated = await jobPostingRepository.moveApplicationToPipelineStage(applicationId, pipelineStageId)
    await recruitmentPostingActivityService.record(postingId, RECRUITMENT_POSTING_ACTIVITY_TYPE.APPLICATION_STAGE_CHANGED, actorId, { pipelineStageId }, applicationId)
    return updated
  }

  async createCandidateApplication(postingId: string, input: CreatePostingCandidateInput, actorId: string) {
    const posting = await this.findById(postingId)
    const application = await jobPostingRepository.createCandidateApplication(postingId, { ...input, source: posting.source })
    await recruitmentPostingActivityService.record(postingId, RECRUITMENT_POSTING_ACTIVITY_TYPE.CANDIDATE_CREATED, actorId, { candidateId: application.candidateId }, application.id)
    return application
  }

  async update(id: string, input: UpdateJobPostingInput, actorId: string) {
    await this.findById(id)
    const posting = await jobPostingRepository.update(id, input)
    await recruitmentPostingActivityService.record(
      id,
      RECRUITMENT_POSTING_ACTIVITY_TYPE.UPDATED,
      actorId,
      { fields: Object.keys(input) },
    )
    return posting
  }

  async archive(id: string, actorId: string) {
    const posting = await this.findById(id)
    if (posting.status === "archived") return posting
    const archived = await jobPostingRepository.archive(id, actorId)
    await recruitmentPostingActivityService.record(
      id,
      RECRUITMENT_POSTING_ACTIVITY_TYPE.ARCHIVED,
      actorId,
    )
    return archived
  }

  async publish(id: string, _input: { mode: "connector" }, actorId: string) {
    const posting = await this.findById(id)
    const connector = this.connectors.get(posting.channel)
    if (!connector) this.throwConnectorNotConfigured(posting.channel)
    try {
      const result = await connector.publish(id)
      const published = await jobPostingRepository.markConnectorPublished(id, result.externalId, result.postingUrl)
      await recruitmentPostingActivityService.record(
        id,
        RECRUITMENT_POSTING_ACTIVITY_TYPE.PUBLISHED,
        actorId,
      )
      return published
    } catch (error) {
      await this.markApiError(id, error)
      throw error
    }
  }

  async sync(id: string, actorId: string) {
    if (this.syncingPostingIds.has(id)) {
      throw new AppError("Bài đăng đang đồng bộ", HttpStatusCode.CONFLICT, LAYER, "SYNC_ALREADY_RUNNING")
    }
    this.syncingPostingIds.add(id)
    try {
      const posting = await this.findById(id)
      const connector = this.connectors.get(posting.channel)
      if (!connector) this.throwConnectorNotConfigured(posting.channel)
      await recruitmentPostingActivityService.record(
        id,
        RECRUITMENT_POSTING_ACTIVITY_TYPE.SYNC_STARTED,
        actorId,
      )
      const result = await connector.sync(id)
      const intake = await recruitmentIntakeService.importConnector({
        requisitionId: posting.requisitionId,
        postingId: posting.id,
        source: posting.source,
        rows: result.rows,
        connectorErrors: result.errors,
      })
      const updated = await jobPostingRepository.markSynced(id)
      await recruitmentPostingActivityService.record(
        id,
        RECRUITMENT_POSTING_ACTIVITY_TYPE.SYNC_COMPLETED,
        actorId,
        { imported: intake.applicationsCreated, skipped: intake.skipped, failed: intake.failed },
      )
      for (const error of intake.errors) {
        await recruitmentPostingActivityService.record(
          id,
          RECRUITMENT_POSTING_ACTIVITY_TYPE.CONNECTOR_RESPONSE_FAILED,
          actorId,
          { email: error.email, code: error.code, message: error.message },
        )
      }
      return {
        ...intake,
        total: result.totalFetched,
        failed: intake.failed,
        errors: intake.errors,
        postingId: id,
        syncedAt: updated.lastSyncedAt,
      }
    } catch (error) {
      await this.markApiError(id, error)
      await recruitmentPostingActivityService.record(
        id,
        RECRUITMENT_POSTING_ACTIVITY_TYPE.SYNC_FAILED,
        actorId,
        { message: error instanceof Error ? error.message : "Unknown sync error" },
      )
      throw error
    } finally {
      this.syncingPostingIds.delete(id)
    }
  }

  private throwConnectorNotConfigured(channel: string): never {
    throw new AppError(
      `Kênh ${channel} chưa được cấu hình connector`,
      HttpStatusCode.CONFLICT,
      LAYER,
      "CONNECTOR_NOT_CONFIGURED",
    )
  }

  private async markApiError(id: string, error: unknown) {
    if (!(error instanceof AppError) || error.errorCode !== "GOOGLE_FORMS_API_ERROR") return
    try {
      await jobPostingRepository.markConnectorError(id)
    } catch {
      // Preserve the actionable upstream error if status persistence also fails.
    }
  }

  private async getPostingStage(postingId: string, stageId: string) {
    const stage = (await jobPostingRepository.listPipelineStages(postingId)).find((item) => item.id === stageId)
    if (!stage) {
      throw new AppError("Giai đoạn không thuộc bài đăng này", HttpStatusCode.BAD_REQUEST, LAYER, "STAGE_POSTING_MISMATCH")
    }
    return stage
  }
}

export const jobPostingService = new JobPostingService(
  new Map([["google_form", googleFormsConnector]]),
)
