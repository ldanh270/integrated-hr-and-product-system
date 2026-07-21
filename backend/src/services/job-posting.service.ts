import { randomUUID } from "node:crypto"
import {
  RECRUITMENT_CHANNEL,
  RECRUITMENT_SOURCE,
  REQUISITION_STATUS,
} from "@/configs/entities/recruitment.config"
import { GOOGLE_FORM_SOURCE_CODE_PREFIX } from "@/configs/rules/google-form.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { jobDescriptionRepository } from "@/repositories/job-description.repository"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import type { CreateJobPostingInput, UpdateJobPostingInput } from "@/schemas/recruitment.schema"
import { AppError } from "@/utils/error.util"
import { recruitmentIntakeService } from "@/services/recruitment-intake.service"
import type { ConnectorSyncResult } from "@/types/recruitment-connector.types"
import { googleFormsConnector } from "@/connectors/google-forms.connector"

const LAYER = "JobPostingService"
export interface RecruitmentConnector {
  publish(postingId: string): Promise<{ externalId: string; postingUrl: string }>
  sync(postingId: string): Promise<ConnectorSyncResult>
}

export class JobPostingService {
  constructor(
    private readonly connectors: ReadonlyMap<string, RecruitmentConnector> = new Map(),
  ) {}

  async create(input: CreateJobPostingInput) {
    const jd = await jobDescriptionRepository.findById(input.jobDescriptionId)
    if (!jd) throw new AppError("Không tìm thấy JD", HttpStatusCode.NOT_FOUND, LAYER)
    if (jd.requisition.status !== REQUISITION_STATUS.APPROVED) {
      throw new AppError(
        "Không thể tạo bài đăng cho yêu cầu chưa được duyệt",
        HttpStatusCode.CONFLICT,
        LAYER,
      )
    }
    const sourceCode = `${GOOGLE_FORM_SOURCE_CODE_PREFIX}_${randomUUID().replaceAll("-", "")}`
    return jobPostingRepository.create({
      jobDescriptionId: input.jobDescriptionId,
      channel: RECRUITMENT_CHANNEL.GOOGLE_FORM,
      source: RECRUITMENT_SOURCE.GOOGLE_FORM,
      sourceCode,
      formFields: input.fields,
    })
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

  async update(id: string, input: UpdateJobPostingInput) {
    await this.findById(id)
    return jobPostingRepository.update(id, input)
  }

  async publish(id: string, _input: { mode: "connector" }) {
    const posting = await this.findById(id)
    const connector = this.connectors.get(posting.channel)
    if (!connector) this.throwConnectorNotConfigured(posting.channel)
    try {
      const result = await connector.publish(id)
      return jobPostingRepository.markConnectorPublished(id, result.externalId, result.postingUrl)
    } catch (error) {
      await this.markApiError(id, error)
      throw error
    }
  }

  async sync(id: string) {
    const posting = await this.findById(id)
    const connector = this.connectors.get(posting.channel)
    if (!connector) this.throwConnectorNotConfigured(posting.channel)
    try {
      const result = await connector.sync(id)
      const intake = await recruitmentIntakeService.importConnector({
        jobDescriptionId: posting.jobDescriptionId,
        postingId: posting.id,
        source: posting.source,
        rows: result.rows,
        connectorErrors: result.errors,
      })
      const updated = await jobPostingRepository.markSynced(id)
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
      throw error
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
}

export const jobPostingService = new JobPostingService(
  new Map([["google_form", googleFormsConnector]]),
)
