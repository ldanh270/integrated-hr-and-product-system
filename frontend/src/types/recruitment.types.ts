// ═══════════════════════════════════════════════════════════════════════════════
// RECRUITMENT TYPES — Frontend type definitions
// ═══════════════════════════════════════════════════════════════════════════════
import type {
  BGC_GROUPS,
  BGC_STATUSES,
  INTERVIEW_FORMATS,
  INTERVIEW_RESULTS,
  INTERVIEW_ROUND_STATUSES,
  RECRUITMENT_APPLICATION_STATUSES,
  RECRUITMENT_OFFER_STATUSES,
  RECRUITMENT_SOURCES,
  REQUISITION_PRIORITIES,
  REQUISITION_STATUSES,
} from "@/config/entities/recruitment.config"

// ── Requisition ──────────────────────────────────────────────────────────────

export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]
export type RequisitionPriority = (typeof REQUISITION_PRIORITIES)[number]

export interface JobRequisition {
  id: string
  code: string
  title: string
  department: string
  positionId: string | null
  position: { id: string; name: string } | null
  positionLevel: string
  employmentType: string
  salaryMin: number | null
  salaryMax: number | null
  headcount: number
  description: string | null
  requirements: string | null
  benefits: string | null
  priority: RequisitionPriority
  status: RequisitionStatus
  reason: string | null
  requestedById: string
  requestedBy: { id: string; fullName: string } | null
  approverId: string | null
  approver: { id: string; fullName: string; position: string | null } | null
  approvedById: string | null
  approvedBy: { id: string; fullName: string } | null
  approvedAt: string | null
  rejectionReason: string | null
  closedAt: string | null
  closedReason: string | null
  filledAt: string | null
  targetHireDate: string | null
  targetCloseDate: string | null
  createdAt: string
  updatedAt: string
}

export type PostingChannel =
  | "linkedin"
  | "facebook"
  | "google_form"
  | "company_website"
  | "agency"
  | "referral"
  | "other"

export type ConnectorStatus = "not_configured" | "ready" | "error"

export type RecruitmentFormFieldType = "short_text" | "paragraph"

export interface RecruitmentFormField {
  key: string
  label: string
  type: RecruitmentFormFieldType
  required: boolean
}

export interface JobDescription {
  id: string
  requisitionId: string
  requisition?: JobRequisition
  title: string
  summary: string | null
  responsibilities: string | null
  requirements: string | null
  benefits: string | null
  salaryMin: number | null
  salaryMax: number | null
  postings?: JobPosting[]
  createdAt: string
  updatedAt: string
}

export interface JobPosting {
  id: string
  jobDescriptionId: string
  jobDescription?: JobDescription
  channel: PostingChannel
  source: string
  sourceCode: string
  postingUrl: string | null
  status: "draft" | "open" | "paused" | "closed" | "archived"
  connectorStatus: ConnectorStatus
  fields?: RecruitmentFormField[]
  publishedAt: string | null
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicantImportRow {
  fullName: string
  email: string
  phone?: string
  cvUrl?: string
  notes?: string
}

export interface ApplicantImportResult {
  total: number
  created: number
  matched: number
  applicationsCreated: number
  candidatesCreated: number
  candidatesMatched: number
  failed: number
  errors: Array<{ row: number; message: string }>
}

// ── Candidate ────────────────────────────────────────────────────────────────

export interface Candidate {
  id: string
  fullName: string
  email: string
  phone: string | null
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  cvUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  source: (typeof RECRUITMENT_SOURCES)[number]
  status: string
  skills: string[]
  yearsOfExperience: number | null
  currentCompany: string | null
  currentPosition: string | null
  expectedSalary: number | null
  expectedSalaryCurrency: string | null
  noticePeriod: string | null
  notes: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

// ── Application ─────────────────────────────────────────────────────────────

export type ApplicationStatus = (typeof RECRUITMENT_APPLICATION_STATUSES)[number]

export interface RecruitmentApplication {
  id: string
  requisitionId: string
  requisition: {
    id: string
    title: string
    code: string
    department: string
    positionLevel: string
    salaryMin: number | null
    salaryMax: number | null
    position: { id: string; name: string } | null
  }
  candidateId: string
  candidate: {
    id: string
    fullName: string
    email: string
    phone: string | null
    cvUrl: string | null
    avatarUrl: string | null
  }
  source: (typeof RECRUITMENT_SOURCES)[number]
  status: ApplicationStatus
  assignedToId: string | null
  assignedTo: { id: string; fullName: string } | null
  rejectReason: string | null
  withdrawReason: string | null
  interviewRounds?: InterviewRound[]
  offers?: RecruitmentOffer[]
  createdAt: string
  updatedAt: string
}

export interface ApplicationNote {
  id: string
  applicationId: string
  note: string
  addedById: string
  addedBy: { id: string; fullName: string }
  createdAt: string
}

export interface KanbanApplication {
  id: string
  candidateId: string
  status: ApplicationStatus
  source: (typeof RECRUITMENT_SOURCES)[number]
  createdAt: string
  updatedAt: string
  // Nested relations
  candidate: {
    id: string
    fullName: string
    email: string
    phone: string | null
    cvUrl: string | null
    avatarUrl: string | null
  }
  requisition: {
    id: string
    title: string
    code: string
    department: string
    positionLevel: string
    salaryMin: number | null
    salaryMax: number | null
    position: { id: string; name: string } | null
  }
  // Computed fields
  candidateName: string
  positionTitle: string
  requisitionCode: string
  interviewRounds?: { id: string; roundNumber: number; status: string }[]
}

// ── Interview ────────────────────────────────────────────────────────────────

export type InterviewFormat = (typeof INTERVIEW_FORMATS)[number]
export type InterviewRoundStatus = (typeof INTERVIEW_ROUND_STATUSES)[number]
export type InterviewResult = (typeof INTERVIEW_RESULTS)[number]

export interface InterviewRound {
  id: string
  applicationId: string
  roundNumber: number
  interviewType: string
  format: InterviewFormat
  scheduledAt: string | null
  durationMinutes: number | null
  location: string | null
  meetingLink: string | null
  interviewerIds: string[]
  interviewers: { id: string; fullName: string }[]
  status: InterviewRoundStatus
  result: InterviewResult | null
  feedback: string | null
  scorecards?: Scorecard[]
  // Computed fields for convenience
  candidateName?: string
  positionTitle?: string
  createdAt: string
  updatedAt: string
}

// ── Scorecard ────────────────────────────────────────────────────────────────

export interface Scorecard {
  id: string
  interviewId: string
  evaluatorId: string
  evaluator: { id: string; fullName: string }
  overallRating: number
  strengths: string | null
  weaknesses: string | null
  recommendation: "strong_hire" | "hire" | "no_hire" | "strong_no_hire" | null
  scores: Record<string, number>
  answers: Record<string, string>
  createdAt: string
  updatedAt: string
}

// ── Offer ─────────────────────────────────────────────────────────────────────

export type OfferStatus = (typeof RECRUITMENT_OFFER_STATUSES)[number]

export interface RecruitmentOffer {
  id: string
  applicationId: string
  candidateId: string
  candidate: { id: string; fullName: string; email: string }
  application?: {
    candidate: { id: string; fullName: string; email: string; phone: string | null }
    requisition: { id: string; title: string; code: string; department: string }
  }
  // Computed fields for convenience
  candidateName?: string
  candidateEmail?: string
  offeredSalary: number
  currency: string
  startDate: string
  endDate: string | null
  trialEndDate: string | null
  jobTitle: string
  department: string
  employmentType: string
  benefits: Record<string, unknown>
  notes: string | null
  status: OfferStatus
  sentAt: string | null
  acceptedAt: string | null
  response: string | null
  candidateResponseNote: string | null
  currentVersion: number
  versions?: OfferVersion[]
  backgroundCheck?: BackgroundCheck
  createdBy: { id: string; fullName: string }
  createdAt: string
  updatedAt: string
}

export interface OfferVersion {
  id: string
  offerId: string
  version: number
  salary: number
  currency: string
  startDate: string
  endDate: string | null
  changeReason: string
  notes: string | null
  createdById: string
  createdBy: { id: string; fullName: string }
  createdAt: string
}

// ── Background Check ─────────────────────────────────────────────────────────

export type BgcGroup = (typeof BGC_GROUPS)[number]
export type BgcStatus = (typeof BGC_STATUSES)[number]

export interface BackgroundCheck {
  id: string
  offerId: string
  candidateId: string
  group: BgcGroup
  status: BgcStatus
  idVerified: boolean | null
  addressVerified: boolean | null
  criminalRecordCheck: boolean | null
  legalStatusCheck: boolean | null
  certificationVerified: boolean | null
  employmentHistoryVerified: boolean | null
  financialCheckCompleted: boolean | null
  creditScoreCheck: boolean | null
  failReason: string | null
  documents: Record<string, unknown> | null
  startedAt: string | null
  completedAt: string | null
  checkedById: string | null
  checkedBy: { id: string; fullName: string } | null
  // Computed fields for convenience
  candidateName?: string
  candidateEmail?: string
  createdAt: string
  updatedAt: string
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface RequisitionStats {
  total: number
  byStatus: Record<string, number>
  pending: number
}

export interface ApplicationStats {
  total: number
  byStatus: Record<string, number>
  bySource: Record<string, number>
  active: number
  rejected: number
}

export interface OfferStats {
  total: number
  byStatus: Record<string, number>
  pending: number
}

export interface BackgroundCheckStats {
  total: number
  byStatus: Record<string, number>
  pending: number
  inProgress: number
}

// ── API Response ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  error: null
  meta?: {
    total: number
    page: number
    pageSize: number
  }
}

export interface SingleResponse<T> {
  data: T
  error: null
}
