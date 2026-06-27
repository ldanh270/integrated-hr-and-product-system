// Business rules limits
export const OFFER_MAX_VERSIONS = 3;
export const OFFER_RESPONSE_DAYS = 3;
export const CANDIDATE_COOLDOWN_MONTHS = 6;

// Enums mapping from Prisma schema
export const REQUISITION_STATUS_VALUES = ["open", "closed", "rejected"] as const;

export const POSTING_STATUS_VALUES = ["draft", "open", "paused", "closed"] as const;

export const JOB_APPLICATION_STATUS_VALUES = [
  "new",
  "reviewing",
  "shortlisted",
  "interviewing",
  "final_review",
  "offer_sent",
  "offer_accepted",
  "background_check",
  "pending_onboarding",
  "hired",
  "rejected",
  "offer_declined",
  "offer_rescinded",
  "candidate_withdrew"
] as const;

export const CANDIDATE_SOURCE_VALUES = [
  "website",
  "linkedin",
  "referral",
  "facebook",
  "recruitment_agency",
  "other"
] as const;

export const INTERVIEW_FORMAT_VALUES = ["in_person", "video_call", "phone"] as const;
export const INTERVIEW_STATUS_VALUES = ["scheduled", "completed", "cancelled", "no_show"] as const;
export const INTERVIEW_RESULT_VALUES = ["pass", "fail", "borderline", "pending"] as const;

export const OFFER_STATUS_VALUES = [
  "draft",
  "pending_approval",
  "sent",
  "accepted",
  "declined",
  "rescinded"
] as const;

export const BGC_ITEM_STATUS_VALUES = ["pending", "passed", "needs_clarification", "failed"] as const;

export const BGC_OVERALL_STATUS_VALUES = ["in_progress", "passed", "conditional", "rescinded"] as const;

export const JOB_FAMILY_VALUES = [
  "engineering",
  "product",
  "design",
  "marketing",
  "sales",
  "hr",
  "finance",
  "operations",
  "other"
] as const;

export const JOB_LEVEL_VALUES = [
  "intern",
  "fresher",
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
  "director"
] as const;

export const SOCIAL_PLATFORMS = ["linkedin", "facebook", "twitter", "website", "other"] as const;

export const REQUISITION_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
  REJECTED: "rejected"
} as const;

export const POSTING_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  PAUSED: "paused",
  CLOSED: "closed"
} as const;

export const JOB_APPLICATION_STATUS = {
  NEW: "new",
  REVIEWING: "reviewing",
  SHORTLISTED: "shortlisted",
  INTERVIEWING: "interviewing",
  FINAL_REVIEW: "final_review",
  OFFER_SENT: "offer_sent",
  OFFER_ACCEPTED: "offer_accepted",
  BACKGROUND_CHECK: "background_check",
  PENDING_ONBOARDING: "pending_onboarding",
  HIRED: "hired",
  REJECTED: "rejected",
  OFFER_DECLINED: "offer_declined",
  OFFER_RESCINDED: "offer_rescinded",
  CANDIDATE_WITHDREW: "candidate_withdrew"
} as const;

export const CANDIDATE_SOURCE = {
  WEBSITE: "website",
  LINKEDIN: "linkedin",
  REFERRAL: "referral",
  FACEBOOK: "facebook",
  RECRUITMENT_AGENCY: "recruitment_agency",
  OTHER: "other"
} as const;

export const INTERVIEW_FORMAT = {
  IN_PERSON: "in_person",
  VIDEO_CALL: "video_call",
  PHONE: "phone"
} as const;

export const INTERVIEW_STATUS = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show"
} as const;

export const INTERVIEW_RESULT = {
  PASS: "pass",
  FAIL: "fail",
  BORDERLINE: "borderline",
  PENDING: "pending"
} as const;

export const OFFER_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  SENT: "sent",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  RESCINDED: "rescinded"
} as const;

export const BGC_ITEM_STATUS = {
  PENDING: "pending",
  PASSED: "passed",
  NEEDS_CLARIFICATION: "needs_clarification",
  FAILED: "failed"
} as const;

export const BGC_OVERALL_STATUS = {
  IN_PROGRESS: "in_progress",
  PASSED: "passed",
  CONDITIONAL: "conditional",
  RESCINDED: "rescinded"
} as const;

export const JOB_FAMILY = {
  ENGINEERING: "engineering",
  PRODUCT: "product",
  DESIGN: "design",
  MARKETING: "marketing",
  SALES: "sales",
  HR: "hr",
  FINANCE: "finance",
  OPERATIONS: "operations",
  OTHER: "other"
} as const;

export const JOB_LEVEL = {
  INTERN: "intern",
  FRESHER: "fresher",
  JUNIOR: "junior",
  MID: "mid",
  SENIOR: "senior",
  LEAD: "lead",
  MANAGER: "manager",
  DIRECTOR: "director"
} as const;
