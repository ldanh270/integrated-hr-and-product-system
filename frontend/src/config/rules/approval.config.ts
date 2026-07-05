import { SYSTEM_ROLE } from "@/config/entities/employee.config"

export const APPROVAL_CONFIG = {
  // Application includes Leave, OT, Shift Swap, WFH, etc.
  application: {
    roles: [SYSTEM_ROLE.ADMIN, SYSTEM_ROLE.GENERAL_MANAGER, SYSTEM_ROLE.HR_MANAGER, SYSTEM_ROLE.TEAM_LEADER],
  },
  // Password reset request
  password_reset: {
    roles: [SYSTEM_ROLE.ADMIN, SYSTEM_ROLE.GENERAL_MANAGER],
  },
  // Recruitment Proposal (Job posting request)
  recruitment_proposal: {
    roles: [SYSTEM_ROLE.ADMIN, SYSTEM_ROLE.GENERAL_MANAGER, SYSTEM_ROLE.HR_MANAGER],
  },
} as const

export const APPROVAL_CATEGORIES = [
  "application",
  "password_reset",
  "recruitment_proposal",
] as const

export const APPROVAL_CATEGORY = {
  APPLICATION: "application",
  PASSWORD_RESET: "password_reset",
  RECRUITMENT_PROPOSAL: "recruitment_proposal",
} as const
