import type {
  BGC_GROUP,
  BGC_STATUS,
  INTERVIEW_FORMAT,
  INTERVIEW_RESULT,
  INTERVIEW_ROUND_STATUS,
  POSTING_STATUS,
  RECRUITMENT_APPLICATION_STATUS,
  RECRUITMENT_OFFER_STATUS,
  RECRUITMENT_SOURCE,
  REQUISITION_PRIORITY,
  REQUISITION_STATUS,
} from "@/configs/entities/recruitment.config"

import type {
  BackgroundCheck,
  Candidate,
  InterviewRound,
  JobRequisition,
  OfferVersion,
  RecruitmentApplication,
  RecruitmentOffer,
  Scorecard,
} from "@prisma/client"

// ── Requisition Types ──────────────────────────────────────────────────────────

export type RequisitionStatus = (typeof REQUISITION_STATUS)[keyof typeof REQUISITION_STATUS]
export type RequisitionPriority = (typeof REQUISITION_PRIORITY)[keyof typeof REQUISITION_PRIORITY]
export interface CandidateSchemaField {
  key: string
  label: string
  type: "short_text" | "paragraph"
  required: boolean
}

export interface CreateJobRequisitionInput {
  title: string
  department?: string
  positionLevel?: string
  employmentType: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  headcount?: number
  priority?: RequisitionPriority
  reason?: string
  targetHireDate?: string
  targetCloseDate?: string
  positionId?: string
  approverId: string
  candidateSchema?: CandidateSchemaField[]
}

export interface UpdateJobRequisitionInput extends Partial<CreateJobRequisitionInput> {
  status?: RequisitionStatus
}

export interface ApproveRequisitionInput {
  approved: boolean
  comment?: string
}

// ── Job Description Types ─────────────────────────────────────────────────────

export type PostingStatus = (typeof POSTING_STATUS)[keyof typeof POSTING_STATUS]

export interface CreateJobDescriptionInput {
  requisitionId: string
  title: string
  summary?: string
  responsibilities?: string
  requirements?: string
  benefits?: string
  salaryMin?: number
  salaryMax?: number
}

export interface UpdateJobDescriptionInput extends Partial<
  Omit<CreateJobDescriptionInput, "requisitionId">
> {}

// ── Candidate Types ───────────────────────────────────────────────────────────

export type RecruitmentSource = (typeof RECRUITMENT_SOURCE)[keyof typeof RECRUITMENT_SOURCE]

export interface CreateCandidateInput {
  fullName: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: string
  nationalId?: string
  source: RecruitmentSource
  linkedinUrl?: string
  portfolioUrl?: string
  cvUrl?: string
  avatarUrl?: string
  notes?: string
}

export interface UpdateCandidateInput extends Partial<CreateCandidateInput> {
  id: string
}

// ── Application Types ────────────────────────────────────────────────────────

export type ApplicationStatus =
  (typeof RECRUITMENT_APPLICATION_STATUS)[keyof typeof RECRUITMENT_APPLICATION_STATUS]

export interface CreateApplicationInput {
  requisitionId: string
  postingId: string
  candidateId: string
  source: RecruitmentSource
  sourceRef?: string
}

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus
  rejectReason?: string
  withdrawReason?: string
}

export interface MoveKanbanInput {
  applicationId: string
  targetStatus: ApplicationStatus
}

// ── Interview Types ───────────────────────────────────────────────────────────

export type InterviewFormat = (typeof INTERVIEW_FORMAT)[keyof typeof INTERVIEW_FORMAT]
export type InterviewRoundStatus =
  (typeof INTERVIEW_ROUND_STATUS)[keyof typeof INTERVIEW_ROUND_STATUS]
export type InterviewResult = (typeof INTERVIEW_RESULT)[keyof typeof INTERVIEW_RESULT]

export interface CreateInterviewRoundInput {
  applicationId: string
  roundNumber: number
  title: string
  format?: InterviewFormat
  scheduledAt: string
  durationMinutes?: number
  location?: string
  meetingLink?: string
  interviewerIds: string[]
}

export interface UpdateInterviewRoundInput extends Partial<CreateInterviewRoundInput> {
  status?: InterviewRoundStatus
  result?: InterviewResult
  feedback?: string
}

// ── Scorecard Types ──────────────────────────────────────────────────────────

export interface CreateScorecardInput {
  interviewId: string
  evaluatorId: string
  overallRating: number
  strengths?: string
  weaknesses?: string
  recommendation?: string
  scores?: Record<string, number>
  answers?: Record<string, string>
}

export interface UpdateScorecardInput extends Partial<CreateScorecardInput> {}

// ── Offer Types ──────────────────────────────────────────────────────────────

export type OfferStatus = (typeof RECRUITMENT_OFFER_STATUS)[keyof typeof RECRUITMENT_OFFER_STATUS]

export interface CreateOfferInput {
  applicationId: string
  candidateId: string
  offeredSalary: number
  currency?: string
  startDate: string
  endDate?: string
  trialEndDate?: string
  jobTitle?: string
  department?: string
  employmentType: string
  benefits?: Record<string, unknown>
  notes?: string
}

export interface CreateOfferVersionInput {
  offerId: string
  salary: number
  currency?: string
  startDate: string
  endDate?: string
  changeReason: string
  notes?: string
}

export interface RespondToOfferInput {
  offerId: string
  response: "accept" | "decline" | "negotiate"
  responseNote?: string
  negotiateSalary?: number
  negotiateStartDate?: string
}

// ── Background Check Types ────────────────────────────────────────────────────

export type BgcGroup = (typeof BGC_GROUP)[keyof typeof BGC_GROUP]
export type BgcStatus = (typeof BGC_STATUS)[keyof typeof BGC_STATUS]

export interface CreateBackgroundCheckInput {
  offerId: string
  candidateId: string
  group: BgcGroup
}

export interface UpdateBackgroundCheckInput {
  status?: BgcStatus
  idVerified?: boolean
  addressVerified?: boolean
  criminalRecordCheck?: boolean
  legalStatusCheck?: boolean
  certificationVerified?: boolean
  employmentHistoryVerified?: boolean
  financialCheckCompleted?: boolean
  creditScoreCheck?: boolean
  failReason?: string
  documents?: Record<string, unknown>
}

// ── Response Types ────────────────────────────────────────────────────────────

export interface JobRequisitionWithRelations extends JobRequisition {
  applications: RecruitmentApplication[]
  requestedBy: { id: string; fullName: string }
  approvedBy?: { id: string; fullName: string } | null
  position?: { id: string; name: string } | null
}

export interface CandidateWithRelations extends Candidate {
  applications: RecruitmentApplication[]
}

export interface RecruitmentApplicationWithRelations extends RecruitmentApplication {
  requisition: JobRequisition & {
    position?: { id: string; name: string } | null
  }
  candidate: Candidate
  interviewRounds: InterviewRound[]
  offers: RecruitmentOffer[]
  assignedTo?: { id: string; fullName: string } | null
}

export interface InterviewRoundWithRelations extends InterviewRound {
  application: RecruitmentApplication & {
    candidate: Candidate
  }
  scorecards: Scorecard[]
}

export interface ScorecardWithRelations extends Scorecard {
  interview: InterviewRound
  evaluator: { id: string; fullName: string }
}

export interface RecruitmentOfferWithRelations extends RecruitmentOffer {
  application: RecruitmentApplication & {
    candidate: Candidate
    requisition: JobRequisition
  }
  candidate: Candidate
  versions: OfferVersion[]
  backgroundCheck?: BackgroundCheck | null
  createdBy: { id: string; fullName: string }
}

export interface BackgroundCheckWithRelations extends BackgroundCheck {
  offer: RecruitmentOffer
  candidate: Candidate
  checkedBy?: { id: string; fullName: string } | null
}

// ── List/Query Types ────────────────────────────────────────────────────────

export interface ListRequisitionsQuery {
  status?: RequisitionStatus
  department?: string
  priority?: RequisitionPriority
  page?: number
  pageSize?: number
}

export interface ListCandidatesQuery {
  source?: RecruitmentSource
  search?: string
  page?: number
  pageSize?: number
}

export interface ListApplicationsQuery {
  requisitionId?: string
  postingId?: string
  status?: ApplicationStatus
  assignedToId?: string
  page?: number
  pageSize?: number
}

// ── Stats Types ──────────────────────────────────────────────────────────────

export interface RecruitmentStats {
  totalRequisitions: number
  openRequisitions: number
  totalCandidates: number
  totalApplications: number
  applicationsByStatus: Record<ApplicationStatus, number>
  offersExtended: number
  offersAccepted: number
  hiresThisMonth: number
}

// ── Requisition Code Generator ────────────────────────────────────────────────

export function generateRequisitionCode(year: number, sequence: number): string {
  return `REQ-${year}-${String(sequence).padStart(4, "0")}`
}
