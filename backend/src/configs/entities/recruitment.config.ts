// ═══════════════════════════════════════════════════════════════════════════════
// RECRUITMENT CONFIG — Source of truth for all enum values
// Values MUST match Prisma schema enums exactly
// ═══════════════════════════════════════════════════════════════════════════════

// ── Requisition ──────────────────────────────────────────────────────────────

export const REQUISITION_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  CLOSED: "closed",
  FILLED: "filled",
} as const

export const REQUISITION_STATUSES = [
  REQUISITION_STATUS.DRAFT,
  REQUISITION_STATUS.PENDING_APPROVAL,
  REQUISITION_STATUS.APPROVED,
  REQUISITION_STATUS.REJECTED,
  REQUISITION_STATUS.CLOSED,
  REQUISITION_STATUS.FILLED,
] as const

export const REQUISITION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const REQUISITION_PRIORITIES = [
  REQUISITION_PRIORITY.LOW,
  REQUISITION_PRIORITY.MEDIUM,
  REQUISITION_PRIORITY.HIGH,
  REQUISITION_PRIORITY.URGENT,
] as const

// ── Posting ───────────────────────────────────────────────────────────────────

export const POSTING_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  PAUSED: "paused",
  CLOSED: "closed",
  ARCHIVED: "archived",
} as const

export const POSTING_STATUSES = [
  POSTING_STATUS.DRAFT,
  POSTING_STATUS.OPEN,
  POSTING_STATUS.PAUSED,
  POSTING_STATUS.CLOSED,
  POSTING_STATUS.ARCHIVED,
] as const

export const RECRUITMENT_CHANNEL = {
  LINKEDIN: "linkedin",
  FACEBOOK: "facebook",
  GOOGLE_FORM: "google_form",
  COMPANY_WEBSITE: "company_website",
  AGENCY: "agency",
  REFERRAL: "referral",
  OTHER: "other",
} as const

export const RECRUITMENT_CHANNELS = Object.values(RECRUITMENT_CHANNEL) as [
  (typeof RECRUITMENT_CHANNEL)[keyof typeof RECRUITMENT_CHANNEL],
  ...(typeof RECRUITMENT_CHANNEL)[keyof typeof RECRUITMENT_CHANNEL][],
]

export const CONNECTOR_STATUS = {
  NOT_CONFIGURED: "not_configured",
  READY: "ready",
  ERROR: "error",
} as const

// ── Recruitment Application ────────────────────────────────────────────────────

export const RECRUITMENT_APPLICATION_STATUS = {
  NEW: "new",
  REVIEWING: "reviewing",
  SHORTLISTED: "shortlisted",
  INTERVIEWING: "interviewing",
  FINAL_REVIEW: "final_review",
  OFFER_SENT: "offer_sent",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_DECLINED: "offer_declined",
  OFFER_RESCINDED: "offer_rescinded",
  BACKGROUND_CHECK: "background_check",
  PENDING_ONBOARDING: "pending_onboarding",
  HIRED: "hired",
  REJECTED: "rejected",
  CANDIDATE_WITHDREW: "candidate_withdrew",
} as const

export const RECRUITMENT_APPLICATION_STATUSES = [
  RECRUITMENT_APPLICATION_STATUS.NEW,
  RECRUITMENT_APPLICATION_STATUS.REVIEWING,
  RECRUITMENT_APPLICATION_STATUS.SHORTLISTED,
  RECRUITMENT_APPLICATION_STATUS.INTERVIEWING,
  RECRUITMENT_APPLICATION_STATUS.FINAL_REVIEW,
  RECRUITMENT_APPLICATION_STATUS.OFFER_SENT,
  RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED,
  RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED,
  RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED,
  RECRUITMENT_APPLICATION_STATUS.BACKGROUND_CHECK,
  RECRUITMENT_APPLICATION_STATUS.PENDING_ONBOARDING,
  RECRUITMENT_APPLICATION_STATUS.HIRED,
  RECRUITMENT_APPLICATION_STATUS.REJECTED,
  RECRUITMENT_APPLICATION_STATUS.CANDIDATE_WITHDREW,
] as const

// Terminal statuses (no further transitions)
export const TERMINAL_APPLICATION_STATUSES = [
  RECRUITMENT_APPLICATION_STATUS.HIRED,
  RECRUITMENT_APPLICATION_STATUS.REJECTED,
  RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED,
  RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED,
  RECRUITMENT_APPLICATION_STATUS.CANDIDATE_WITHDREW,
] as const

// ── Recruitment Source ─────────────────────────────────────────────────────────

export const RECRUITMENT_SOURCE = {
  WEBSITE: "website",
  LINKEDIN: "linkedin",
  REFERRAL: "referral",
  FACEBOOK: "facebook",
  RECRUITMENT_AGENCY: "recruitment_agency",
  GOOGLE_FORM: "google_form",
  COMPANY_WEBSITE: "company_website",
  AGENCY: "agency",
  OTHER: "other",
} as const

export const RECRUITMENT_SOURCES = [
  RECRUITMENT_SOURCE.WEBSITE,
  RECRUITMENT_SOURCE.LINKEDIN,
  RECRUITMENT_SOURCE.REFERRAL,
  RECRUITMENT_SOURCE.FACEBOOK,
  RECRUITMENT_SOURCE.RECRUITMENT_AGENCY,
  RECRUITMENT_SOURCE.GOOGLE_FORM,
  RECRUITMENT_SOURCE.COMPANY_WEBSITE,
  RECRUITMENT_SOURCE.AGENCY,
  RECRUITMENT_SOURCE.OTHER,
] as const

// ── Interview ──────────────────────────────────────────────────────────────────

export const INTERVIEW_FORMAT = {
  IN_PERSON: "in_person",
  VIDEO_CALL: "video_call",
  PHONE: "phone",
} as const

export const INTERVIEW_FORMATS = [
  INTERVIEW_FORMAT.IN_PERSON,
  INTERVIEW_FORMAT.VIDEO_CALL,
  INTERVIEW_FORMAT.PHONE,
] as const

export const INTERVIEW_ROUND_STATUS = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const

export const INTERVIEW_ROUND_STATUSES = [
  INTERVIEW_ROUND_STATUS.SCHEDULED,
  INTERVIEW_ROUND_STATUS.COMPLETED,
  INTERVIEW_ROUND_STATUS.CANCELLED,
  INTERVIEW_ROUND_STATUS.NO_SHOW,
] as const

export const INTERVIEW_RESULT = {
  PASS: "pass",
  FAIL: "fail",
  PENDING: "pending",
  NO_SHOW: "no_show",
} as const

export const INTERVIEW_RESULTS = [
  INTERVIEW_RESULT.PASS,
  INTERVIEW_RESULT.FAIL,
  INTERVIEW_RESULT.PENDING,
  INTERVIEW_RESULT.NO_SHOW,
] as const

// ── Background Check ──────────────────────────────────────────────────────────

export const BGC_GROUP = {
  A: "a", // Basic: ID verification, address, education
  B: "b", // Legal: Criminal record, credit check
  C: "c", // Professional: Certification, employment history
  D: "d", // Executive: Full verification + financial
} as const

export const BGC_GROUPS = [
  BGC_GROUP.A,
  BGC_GROUP.B,
  BGC_GROUP.C,
  BGC_GROUP.D,
] as const

export const BGC_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PASSED: "passed",
  FAILED: "failed",
} as const

export const BGC_STATUSES = [
  BGC_STATUS.PENDING,
  BGC_STATUS.IN_PROGRESS,
  BGC_STATUS.COMPLETED,
  BGC_STATUS.PASSED,
  BGC_STATUS.FAILED,
] as const

// ── Offer ─────────────────────────────────────────────────────────────────────

export const RECRUITMENT_OFFER_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  RESCINDED: "rescinded",
  EXPIRED: "expired",
} as const

export const RECRUITMENT_OFFER_STATUSES = [
  RECRUITMENT_OFFER_STATUS.DRAFT,
  RECRUITMENT_OFFER_STATUS.SENT,
  RECRUITMENT_OFFER_STATUS.ACCEPTED,
  RECRUITMENT_OFFER_STATUS.DECLINED,
  RECRUITMENT_OFFER_STATUS.RESCINDED,
  RECRUITMENT_OFFER_STATUS.EXPIRED,
] as const

// ── Legacy Exports (for backward compatibility) ────────────────────────────────

export const PROPOSAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CLOSED: "closed",
} as const

export const PROPOSAL_STATUSES = [
  PROPOSAL_STATUS.PENDING,
  PROPOSAL_STATUS.APPROVED,
  PROPOSAL_STATUS.REJECTED,
  PROPOSAL_STATUS.CLOSED,
] as const

export const CANDIDATE_STATUSES = [
  "new",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
] as const

export const SOCIAL_PLATFORMS = ["linkedin", "facebook", "twitter", "website", "other"] as const
