/** Personal tab keys used in URL paths and sidebar navigation. */
export const PERSONAL_TAB = {
  SCHEDULE: "schedule",
  PAYSLIPS: "payslips",
  PROJECTS: "projects",
} as const

export type PersonalTab = (typeof PERSONAL_TAB)[keyof typeof PERSONAL_TAB]

/** Display labels for personal tabs. Single source of truth for UI text. */
export const PERSONAL_TAB_LABELS: Record<PersonalTab, string> = {
  schedule: "Lịch của tôi",
  payslips: "Lương của tôi",
  projects: "Dự án của tôi",
}

/** Legacy URL paths → new personal tab path. Used for backward-compatible redirects. */
export const PERSONAL_LEGACY_PATHS = {
  [PERSONAL_TAB.SCHEDULE]: "/attendance/my-schedule",
  [PERSONAL_TAB.PAYSLIPS]: "/payroll/my-payslips",
  [PERSONAL_TAB.PROJECTS]: "/project/dashboard",
} as const
