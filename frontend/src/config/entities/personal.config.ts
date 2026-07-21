/** Personal tab keys used in URL paths and sidebar navigation. */
export const PERSONAL_TAB = {
  SCHEDULE: "schedule",
  /** Part-time weekly free-time submission (hidden for full-time via nav filter). */
  AVAILABILITY: "availability",
  PAYSLIPS: "payslips",
  PROJECTS: "projects",
  APPLICATIONS: "applications",
} as const

export type PersonalTab = (typeof PERSONAL_TAB)[keyof typeof PERSONAL_TAB]

/** Display labels for personal tabs. Single source of truth for UI text. */
export const PERSONAL_TAB_LABELS: Record<PersonalTab, string> = {
  [PERSONAL_TAB.SCHEDULE]: "Lịch của tôi",
  [PERSONAL_TAB.AVAILABILITY]: "Lịch rảnh",
  [PERSONAL_TAB.PAYSLIPS]: "Lương của tôi",
  [PERSONAL_TAB.PROJECTS]: "Dự án của tôi",
  [PERSONAL_TAB.APPLICATIONS]: "Đơn của tôi",
}

/** Legacy URL paths → new personal tab path. Used for backward-compatible redirects. */
export const PERSONAL_LEGACY_PATHS = {
  [PERSONAL_TAB.SCHEDULE]: "/attendance/my-schedule",
  [PERSONAL_TAB.AVAILABILITY]: "/attendance/my-availability",
  [PERSONAL_TAB.PAYSLIPS]: "/payroll/my-payslips",
  [PERSONAL_TAB.PROJECTS]: "/project/my-projects",
  [PERSONAL_TAB.APPLICATIONS]: "/application/my-applications",
} as const
