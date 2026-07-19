import { HttpStatusCode } from "@/configs/system/http.config"
import {
  GOOGLE_FORM_DEFAULT_FIELDS,
  googleFormQuestionId,
  type GoogleFormFieldDefinition,
} from "@/configs/rules/google-form.config"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import { recruitmentOAuthAccountRepository } from "@/repositories/recruitment-oauth-account.repository"
import { googleFormFieldSchema, intakeRowSchema } from "@/schemas/recruitment.schema"
import { recruitmentOAuthAccountService } from "@/services/recruitment-oauth-account.service"
import type { RecruitmentConnector } from "@/services/job-posting.service"
import type {
  ConnectorIntakeRow,
  ConnectorRowError,
  ConnectorSyncResult,
} from "@/types/recruitment-connector.types"
import { AppError } from "@/utils/error.util"

interface GoogleOAuthCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

const LAYER = "GoogleFormsConnector"
const FORMS_API = "https://forms.googleapis.com/v1/forms"
const TOKEN_URL = "https://oauth2.googleapis.com/token"

export const GOOGLE_FORM_QUESTION_IDS = {
  FULL_NAME: googleFormQuestionId("full_name"),
  EMAIL: googleFormQuestionId("email"),
  PHONE: googleFormQuestionId("phone"),
  CV_URL: googleFormQuestionId("cv_url"),
  NOTES: googleFormQuestionId("notes"),
} as const

interface GoogleForm {
  formId: string
  responderUri?: string
  items?: Array<{
    itemId?: string
    title?: string
    questionItem?: {
      question?: {
        questionId?: string
      }
    }
  }>
}

interface GoogleAnswer {
  textAnswers?: { answers?: Array<{ value?: string }> }
  fileUploadAnswers?: { answers?: Array<{ fileId?: string }> }
}

interface GoogleFormResponse {
  responseId?: string
  answers?: Record<string, GoogleAnswer>
}

interface GoogleResponsesPage {
  responses?: GoogleFormResponse[]
  nextPageToken?: string
}

type PostingRepository = Pick<
  typeof jobPostingRepository,
  "findById" | "storeConnectorExternalId"
>

export class GoogleFormsConnector implements RecruitmentConnector {
  private readonly oauthService = recruitmentOAuthAccountService

  constructor(
    private readonly fetchFn: typeof fetch = fetch,
    private readonly postingRepository: PostingRepository = jobPostingRepository,
  ) {}

  async publish(postingId: string): Promise<{ externalId: string; postingUrl: string }> {
    const posting = await this.postingRepository.findById(postingId)
    if (!posting || posting.channel !== "google_form") {
      throw new AppError(
        "Bài đăng Google Form không tồn tại",
        HttpStatusCode.NOT_FOUND,
        LAYER,
        "GOOGLE_FORM_POSTING_NOT_FOUND",
      )
    }

    const config = await this.requireConfig(posting)
    const token = await this.getAccessToken(config)
    let formId = posting.externalId
    let existingItems: GoogleForm["items"] = []
    if (!formId) {
      const created = await this.request<GoogleForm>(token, FORMS_API, {
        method: "POST",
        body: JSON.stringify({
          info: { title: posting.requisition.title },
        }),
      })
      formId = created.formId
      await this.postingRepository.storeConnectorExternalId(postingId, formId)
    } else {
      const existing = await this.request<GoogleForm>(token, `${FORMS_API}/${formId}`)
      existingItems = existing.items
    }

    const existingTitles = new Set(
      (existingItems ?? []).map((item) => item.title?.trim()).filter((t): t is string => Boolean(t))
    )
    const fields = this.formFields(posting.formFields)
    const description = this.buildDescription(posting.requisition)
    const requests: Array<Record<string, unknown>> = [
      {
        updateFormInfo: {
          info: { title: posting.requisition.title, description },
          updateMask: "title,description",
        },
      },
      ...this.questionRequests(fields, existingTitles),
    ]
    await this.request(token, `${FORMS_API}/${formId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ includeFormInResponse: false, requests }),
    })
    await this.request(token, `${FORMS_API}/${formId}:setPublishSettings`, {
      method: "POST",
      body: JSON.stringify({
        publishSettings: {
          publishState: { isPublished: true, isAcceptingResponses: true },
        },
      }),
    })
    const published = await this.request<GoogleForm>(token, `${FORMS_API}/${formId}`)
    if (!published.responderUri) {
      throw this.apiError("Google Forms không trả về đường dẫn ứng tuyển")
    }
    return { externalId: formId, postingUrl: published.responderUri }
  }

  async sync(postingId: string): Promise<ConnectorSyncResult> {
    const posting = await this.postingRepository.findById(postingId)
    if (!posting || posting.channel !== "google_form") {
      throw new AppError(
        "Bài đăng Google Form không tồn tại",
        HttpStatusCode.NOT_FOUND,
        LAYER,
        "GOOGLE_FORM_POSTING_NOT_FOUND",
      )
    }
    if (!posting.externalId) {
      throw new AppError(
        "Google Form chưa được xuất bản",
        HttpStatusCode.CONFLICT,
        LAYER,
        "GOOGLE_FORM_NOT_PUBLISHED",
      )
    }

    const config = await this.requireConfig(posting)
    const token = await this.getAccessToken(config)
    const form = await this.request<GoogleForm>(token, `${FORMS_API}/${posting.externalId}`)
    const fields = this.formFields(posting.formFields)

    const questionIdMap = new Map<string, string>()
    for (const item of form.items ?? []) {
      const qId = item.questionItem?.question?.questionId
      const title = item.title?.trim()
      if (!qId || !title) continue
      const matchedField = fields.find(
        (f) => f.label.trim() === title || f.key.trim().toLowerCase() === title.toLowerCase()
      )
      if (matchedField) {
        questionIdMap.set(matchedField.key, qId)
      }
    }

    const responses: GoogleFormResponse[] = []
    let pageToken: string | undefined
    do {
      const query = new URLSearchParams({ pageSize: "500" })
      if (pageToken) query.set("pageToken", pageToken)
      const page = await this.request<GoogleResponsesPage>(
        token,
        `${FORMS_API}/${posting.externalId}/responses?${query.toString()}`,
      )
      responses.push(...(page.responses ?? []))
      pageToken = page.nextPageToken
    } while (pageToken)

    const rows: ConnectorIntakeRow[] = []
    const errors: ConnectorRowError[] = []
    for (const [index, response] of responses.entries()) {
      const responseId = response.responseId?.trim()
      const responseData = Object.fromEntries(
        fields.map((field) => {
          const qId = questionIdMap.get(field.key)
          return [field.key, qId ? this.text(response, qId) : ""]
        })
      )
      const cvQId = questionIdMap.get("cv_url")
      const raw = {
        fullName: responseData.full_name ?? "",
        email: (responseData.email ?? "").toLowerCase(),
        phone: responseData.phone || undefined,
        cvUrl: cvQId ? this.cvUrl(response, cvQId) : undefined,
        notes: responseData.notes || undefined,
      }
      const parsed = intakeRowSchema.safeParse(raw)
      if (!responseId || !parsed.success) {
        const validationMessage = parsed.success
          ? ""
          : parsed.error?.issues.map((issue) => issue.message).join("; ")
        errors.push({
          row: index + 1,
          email: raw.email,
          code: "INVALID_GOOGLE_FORM_RESPONSE",
          message: responseId
            ? validationMessage || "Dữ liệu Google Form không hợp lệ"
            : "Google response không có responseId",
          sourceRef: responseId ?? `row-${index + 1}`,
          responseData,
        })
        continue
      }
      rows.push({ ...parsed.data, externalResponseId: responseId, responseData })
    }
    return { rows, errors, totalFetched: responses.length }
  }

  private async requireConfig(posting: { id?: string; oauthAccountId: string | null; oauthAccount?: { clientId: string; clientSecret: string; refreshToken: string } | null }): Promise<GoogleOAuthCredentials> {
    // Try to use the OAuth account directly linked to the posting first
    if (posting.oauthAccount?.clientId && posting.oauthAccount?.clientSecret && posting.oauthAccount?.refreshToken) {
      return {
        clientId: posting.oauthAccount.clientId,
        clientSecret: posting.oauthAccount.clientSecret,
        refreshToken: posting.oauthAccount.refreshToken,
      }
    }

    // Fallback: search for any active OAuth account linked for google_form channel in database
    const defaultOAuth = await recruitmentOAuthAccountRepository.findFirstByChannel("google_form")
    if (defaultOAuth?.clientId && defaultOAuth?.clientSecret && defaultOAuth?.refreshToken) {
      if (posting.id) {
        await jobPostingRepository.storeConnectorOAuthAccountId(posting.id, defaultOAuth.id)
      }
      return {
        clientId: defaultOAuth.clientId,
        clientSecret: defaultOAuth.clientSecret,
        refreshToken: defaultOAuth.refreshToken,
      }
    }

    throw new AppError(
      "Google Form chưa được kết nối với tài khoản OAuth. Vui lòng vào trang Kênh tuyển dụng (OAuth) để kết nối trước khi xuất bản.",
      HttpStatusCode.CONFLICT,
      LAYER,
      "CONNECTOR_NOT_CONFIGURED",
    )
  }

  private async getAccessToken(config: GoogleOAuthCredentials): Promise<string> {
    const response = await this.fetchFn(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    })
    if (!response.ok) throw this.apiError("Không thể xác thực Google Forms")
    const body = (await response.json()) as { access_token?: string }
    if (!body.access_token) throw this.apiError("Google OAuth không trả về access token")
    return body.access_token
  }

  private async request<T = unknown>(token: string, url: string, init?: RequestInit): Promise<T> {
    let response: Response
    try {
      response = await this.fetchFn(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...init?.headers,
        },
      })
    } catch {
      throw this.apiError("Không thể kết nối Google Forms")
    }
    if (!response.ok) {
      let detail = ""
      try {
        const body = (await response.json()) as { error?: { message?: string } }
        detail = body.error?.message ? `: ${body.error.message}` : ""
      } catch {
        // Do not leak raw upstream responses.
      }
      throw this.apiError(`Google Forms API từ chối yêu cầu${detail}`)
    }
    return (await response.json()) as T
  }

  private questionRequests(
    fields: readonly GoogleFormFieldDefinition[],
    existingTitles: Set<string>,
  ): Array<Record<string, unknown>> {
    return fields.flatMap((field, index) => {
      if (existingTitles.has(field.label.trim())) {
        return []
      }
      return [
        {
          createItem: {
            item: {
              title: field.label,
              questionItem: {
                question: {
                  required: field.required,
                  textQuestion: { paragraph: field.type === "paragraph" },
                },
              },
            },
            location: { index },
          },
        },
      ]
    })
  }

  private buildDescription(jd: {
    summary: string | null
    responsibilities: string | null
    requirements: string | null
    benefits: string | null
  }): string {
    return [jd.summary, jd.responsibilities, jd.requirements, jd.benefits]
      .filter((value): value is string => Boolean(value?.trim()))
      .join("\n\n")
  }

  private text(response: GoogleFormResponse, questionId: string): string {
    return response.answers?.[questionId]?.textAnswers?.answers?.[0]?.value?.trim() ?? ""
  }

  private optionalText(response: GoogleFormResponse, questionId: string): string | undefined {
    return this.text(response, questionId) || undefined
  }

  private cvUrl(response: GoogleFormResponse, questionId: string): string | undefined {
    const text = this.optionalText(response, questionId)
    if (text) return text
    const fileId = response.answers?.[questionId]
      ?.fileUploadAnswers?.answers?.[0]?.fileId
    return fileId ? `https://drive.google.com/open?id=${encodeURIComponent(fileId)}` : undefined
  }

  private formFields(value: unknown): readonly GoogleFormFieldDefinition[] {
    if (value === null || value === undefined) return GOOGLE_FORM_DEFAULT_FIELDS
    if (!Array.isArray(value)) throw this.apiError("Cấu hình trường Google Form không hợp lệ")
    return value.map((field) => {
      const parsed = googleFormFieldSchema.safeParse(field)
      if (!parsed.success) throw this.apiError("Cấu hình trường Google Form không hợp lệ")
      return parsed.data
    })
  }

  private apiError(message: string): AppError {
    return new AppError(
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      LAYER,
      "GOOGLE_FORMS_API_ERROR",
    )
  }
}

export const googleFormsConnector = new GoogleFormsConnector()
