/**
 * Project status enumeration
 * Represents the lifecycle states of a project
 */
export const PROJECT_STATUS = {
  PLANNING: "planning",
  ACTIVE: "active",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

/**
 * Array of all valid project statuses
 * Used for validation and filtering
 */
export const PROJECT_STATUSES = [
  PROJECT_STATUS.PLANNING,
  PROJECT_STATUS.ACTIVE,
  PROJECT_STATUS.ON_HOLD,
  PROJECT_STATUS.COMPLETED,
  PROJECT_STATUS.CANCELLED,
] as const
/**
 * Task creation policy enumeration
 * Defines who can create tasks within a project
 */
export const TASK_CREATION_POLICY = {
  LEADER_ONLY: "leader_only",
  ALL_MEMBERS: "all_members",
} as const
/**
 * Array of all valid task creation policies
 * Used for validation and filtering
 */
export const TASK_CREATION_POLICIES = [
  TASK_CREATION_POLICY.LEADER_ONLY,
  TASK_CREATION_POLICY.ALL_MEMBERS,
] as const
/**
 * Task priority levels enumeration
 * Used to prioritize task completion
 */
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const
/**
 * Task status enumeration
 * Represents the workflow states of a task
 */
export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done", "cancelled"] as const
