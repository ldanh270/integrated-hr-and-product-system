export const APPROVAL_CONFIG = {
  // Application includes Leave, OT, Shift Swap, WFH, etc.
  application: {
    roles: ["admin", "general_manager", "hr_manager", "team_leader"],
  },
  // Password reset request
  password_reset: {
    roles: ["admin", "general_manager"],
  },
  // Recruitment Proposal (Job posting request)
  recruitment_proposal: {
    roles: ["admin", "general_manager", "hr_manager"],
  },
} as const

export type RequestCategory = keyof typeof APPROVAL_CONFIG
