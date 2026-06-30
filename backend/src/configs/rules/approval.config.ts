import { SYSTEM_ROLE } from "@/configs/entities/employee.config.ts"

export const APPROVAL_CATEGORY = {
  APPLICATION: "application",
  PASSWORD_RESET: "password_reset",
  RECRUITMENT_PROPOSAL: "recruitment_proposal",
} as const

export const APPROVAL_CONFIG = {
  // Application includes Leave, OT, Shift Swap, WFH, etc.
  [APPROVAL_CATEGORY.APPLICATION]: {
    roles: [
      SYSTEM_ROLE.ADMIN,
      SYSTEM_ROLE.GENERAL_MANAGER,
      SYSTEM_ROLE.HR_MANAGER,
      SYSTEM_ROLE.TEAM_LEADER,
    ],
  },
  // Password reset request
  [APPROVAL_CATEGORY.PASSWORD_RESET]: {
    roles: [SYSTEM_ROLE.ADMIN, SYSTEM_ROLE.GENERAL_MANAGER],
  },
  // Recruitment Proposal (Job posting request)
  [APPROVAL_CATEGORY.RECRUITMENT_PROPOSAL]: {
    roles: [SYSTEM_ROLE.ADMIN, SYSTEM_ROLE.GENERAL_MANAGER, SYSTEM_ROLE.HR_MANAGER],
  },
} as const

export type RequestCategory = keyof typeof APPROVAL_CONFIG
