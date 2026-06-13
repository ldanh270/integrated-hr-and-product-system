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

/**
 * Spent time activity types
 */
export const SPENT_TIME_ACTIVITY = {
  DEVELOP: "develop",
  DESIGN: "design",
  TEST: "test",
  MANAGE: "manage",
  OTHER: "other",
} as const

export const SPENT_TIME_ACTIVITIES = [
  SPENT_TIME_ACTIVITY.DEVELOP,
  SPENT_TIME_ACTIVITY.DESIGN,
  SPENT_TIME_ACTIVITY.TEST,
  SPENT_TIME_ACTIVITY.MANAGE,
  SPENT_TIME_ACTIVITY.OTHER,
] as const

/**
 * Spent time work time types
 */
export const SPENT_TIME_WORK_TIME_TYPE = {
  WORKING_DAY: "working_day",
  OVERTIME: "overtime",
} as const

export const SPENT_TIME_WORK_TIME_TYPES = [
  SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
  SPENT_TIME_WORK_TIME_TYPE.OVERTIME,
] as const

/**
 * Task tracker enumeration
 */
export const TASK_TRACKER = {
  FEATURE: "feature",
  BUG: "bug",
  SUPPORT: "support",
  TASK: "task",
  MEETING: "meeting",
  TEST: "test",
  SUBTASK: "subtask",
  MANAGEMENT: "management",
} as const

/**
 * Array of all valid task trackers
 */
export const TASK_TRACKERS = [
  TASK_TRACKER.FEATURE,
  TASK_TRACKER.BUG,
  TASK_TRACKER.SUPPORT,
  TASK_TRACKER.TASK,
  TASK_TRACKER.MEETING,
  TASK_TRACKER.TEST,
  TASK_TRACKER.SUBTASK,
  TASK_TRACKER.MANAGEMENT,
] as const
