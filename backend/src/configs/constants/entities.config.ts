// ─── EMPLOYEE ─────────────────────────────────────────────────
export const EMPLOYEE_TYPES = ["full_time", "part_time", "intern"] as const
export const EMPLOYEE_STATUSES = ["active", "inactive", "on_leave", "terminated"] as const
export const EMPLOYEE_ROLES = [
  "employee",
  "team_leader",
  "hr_manager",
  "general_manager",
  "admin",
] as const

// ─── ATTENDANCE ───────────────────────────────────────────────
export const EMPLOYEE_SHIFT_STATUSES = [
  "scheduled",
  "holiday_pending",
  "confirmed",
  "cancelled",
] as const
export type IEmployeeShiftStatus = (typeof EMPLOYEE_SHIFT_STATUSES)[number]

export const HOLIDAY_TYPES = ["national", "company"] as const
export type IHolidayType = (typeof HOLIDAY_TYPES)[number]

export const ATTENDANCE_STATUSES = ["on_time", "late", "early_leave", "absent", "overtime"] as const
export type IAttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const APPLICATION_TYPES = [
  "leave",
  "overtime",
  "work_from_home",
  "shift_swap",
  "business_trip",
  "maternity",
  "paternity",
  "sick",
] as const
export type IApplicationType = (typeof APPLICATION_TYPES)[number]

export const APPLICATION_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const
export type IApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const REGIME_TYPES = ["paid", "unpaid"] as const
export type IRegimeType = (typeof REGIME_TYPES)[number]

// ─── PAYROLL ──────────────────────────────────────────────────
export const PAYROLL_COMPONENT_TYPES = ["addition", "deduction"] as const
export const PAYROLL_VALUE_TYPES = ["fixed", "percentage", "formula"] as const
export const PAYROLL_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "paid",
] as const

// ─── RECRUITMENT ──────────────────────────────────────────────
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

export const PROPOSAL_STATUSES = ["pending", "approved", "rejected", "closed"] as const

// ─── PROJECT / TASK ────────────────────────────────────────────
export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"] as const
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const
export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done", "cancelled"] as const

// ─── AUTH ─────────────────────────────────────────────────────
export const PASSWORD_RESET_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "used",
  "expired",
] as const

// ─── GM SCOPE ─────────────────────────────────────────────────
export const GM_SCOPES = ["all", "department", "region"] as const
