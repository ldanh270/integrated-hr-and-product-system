export const APPROVAL_CATEGORY = {
  APPLICATION: "application",
  PASSWORD_RESET: "password_reset",
  RECRUITMENT_PROPOSAL: "recruitment_proposal",
} as const

export type RequestCategory = (typeof APPROVAL_CATEGORY)[keyof typeof APPROVAL_CATEGORY]
