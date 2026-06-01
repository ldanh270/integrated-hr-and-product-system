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

export const POSTING_STATUSES = ["draft", "open", "closed", "paused"] as const

export const CANDIDATE_STATUSES = [
  "new",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
] as const

export const CANDIDATE_SOURCES = [
  "website",
  "linkedin",
  "referral",
  "facebook",
  "recruitment_agency",
  "other",
] as const

export const INTERVIEW_FORMATS = ["in_person", "video_call", "phone"] as const
export const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const
export const INTERVIEW_RESULTS = ["pass", "fail", "pending"] as const
export const SOCIAL_PLATFORMS = ["linkedin", "facebook", "twitter", "website", "other"] as const
