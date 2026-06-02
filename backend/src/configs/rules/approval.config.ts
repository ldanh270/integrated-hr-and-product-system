import { ROLE } from "@/configs/entities/employee.config.ts"

export const APPROVAL_CONFIG = {
  // Application includes Leave, OT, Shift Swap, WFH, etc.
  application: {
    roles: [ROLE.ADMIN, ROLE.GENERAL_MANAGER, ROLE.HR_MANAGER, ROLE.TEAM_LEADER],
  },
  // Password reset request
  password_reset: {
    roles: [ROLE.ADMIN, ROLE.GENERAL_MANAGER],
  },
  // Recruitment Proposal (Job posting request)
  recruitment_proposal: {
    roles: [ROLE.ADMIN, ROLE.GENERAL_MANAGER, ROLE.HR_MANAGER],
  },
} as const

export type RequestCategory = keyof typeof APPROVAL_CONFIG
