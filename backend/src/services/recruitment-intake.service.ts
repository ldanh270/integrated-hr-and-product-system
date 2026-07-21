import { POSTING_STATUS, REQUISITION_STATUS } from "@/configs/entities/recruitment.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { jobDescriptionRepository } from "@/repositories/job-description.repository"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import { recruitmentIntakeRepository } from "@/repositories/recruitment-intake.repository"
import type { ImportRecruitmentIntakeInput } from "@/schemas/recruitment.schema"
import { AppError } from "@/utils/error.util"
import type { ConnectorImportInput } from "@/types/recruitment-connector.types"

const LAYER = "RecruitmentIntakeService"

export class RecruitmentIntakeService {
  async import(input: ImportRecruitmentIntakeInput) {
    return this.importInternal(input)
  }

  async importConnector(input: ConnectorImportInput) {
    return this.importInternal(input)
  }

  private async importInternal(input: ImportRecruitmentIntakeInput | ConnectorImportInput) {
    const jd = await jobDescriptionRepository.findById(input.jobDescriptionId)
    if (!jd) throw new AppError("Không tìm thấy JD", HttpStatusCode.NOT_FOUND, LAYER)
    if (jd.requisition.status !== REQUISITION_STATUS.APPROVED) {
      throw new AppError(
        "Chỉ được tiếp nhận ứng viên cho yêu cầu đã duyệt",
        HttpStatusCode.CONFLICT,
        LAYER,
      )
    }

    let sourceRef: string | null | undefined
    if (input.postingId) {
      const posting = await jobPostingRepository.findById(input.postingId)
      if (!posting) {
        throw new AppError("Không tìm thấy bài đăng tuyển", HttpStatusCode.NOT_FOUND, LAYER)
      }
      if (posting.jobDescriptionId !== input.jobDescriptionId) {
        throw new AppError(
          "Bài đăng không thuộc JD đã chọn",
          HttpStatusCode.BAD_REQUEST,
          LAYER,
          "POSTING_JD_MISMATCH",
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
      if (posting.status === POSTING_STATUS.DRAFT) {
        throw new AppError(
          "Bài đăng chưa được xuất bản",
          HttpStatusCode.CONFLICT,
          LAYER,
          "POSTING_NOT_PUBLISHED",
        )
      }
      sourceRef = posting.sourceCode
    }

    return recruitmentIntakeRepository.importBatch(input, jd.requisitionId, sourceRef)
  }
}

export const recruitmentIntakeService = new RecruitmentIntakeService()
