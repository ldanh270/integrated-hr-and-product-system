export const PROJECT_STATUS = {
  PLANNING: "planning",
  ACTIVE: "active",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

export const PROJECT_STATUSES = [
  PROJECT_STATUS.PLANNING,
  PROJECT_STATUS.ACTIVE,
  PROJECT_STATUS.ON_HOLD,
  PROJECT_STATUS.COMPLETED,
  PROJECT_STATUS.CANCELLED,
] as const
export const TASK_CREATION_POLICY = {
  LEADER_ONLY: "leader_only",
  ALL_MEMBERS: "all_members",
} as const
export const TASK_CREATION_POLICIES = [
  TASK_CREATION_POLICY.LEADER_ONLY,
  TASK_CREATION_POLICY.ALL_MEMBERS,
] as const
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const
export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done", "cancelled"] as const
