/** Application role names stored in AppRole.name. */
export const APP_ROLE = {
  ADMIN: "admin",
} as const

export const EMPLOYEE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "on_leave",
  TERMINATED: "terminated",
} as const

export const EMPLOYEE_TYPES = ["full_time", "part_time", "contractor", "intern"] as const
export type IEmployeeType = (typeof EMPLOYEE_TYPES)[number]

export const WORK_SCHEDULE_TYPES = ["full_time", "part_time"] as const
export type IWorkScheduleType = (typeof WORK_SCHEDULE_TYPES)[number]

/** Employment category options shown in HR forms (excludes legacy part_time). */
export const EMPLOYMENT_CATEGORY_TYPES = ["full_time", "contractor", "intern"] as const
export type IEmploymentCategoryType = (typeof EMPLOYMENT_CATEGORY_TYPES)[number]

/**
 * Contract type keys — values must match Prisma EmployeeType exactly.
 * PART_TIME (legacy): kept for DB enum; use workScheduleType for schedule logic.
 */
export const EMPLOYEE_TYPE = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACTOR: "contractor",
  INTERN: "intern",
} as const

export const WORK_SCHEDULE_TYPE = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
} as const

/** Stable position codes used for cross-module employee lookup. */
export const EMPLOYEE_POSITION_CODE = {
  TESTER: "tester",
} as const

/** Schedule hours drive attendance/payroll branching — independent of employment category (employeeType). */

export const EMPLOYEE_STATUSES = [
  EMPLOYEE_STATUS.ACTIVE,
  EMPLOYEE_STATUS.INACTIVE,
  EMPLOYEE_STATUS.ON_LEAVE,
  EMPLOYEE_STATUS.TERMINATED,
] as const
export type IEmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const GM_SCOPES = ["all", "department", "region"] as const
