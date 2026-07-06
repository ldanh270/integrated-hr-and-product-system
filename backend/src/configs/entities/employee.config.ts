export const EMPLOYEE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "on_leave",
  TERMINATED: "terminated",
} as const

export const EMPLOYEE_TYPES = ["full_time", "part_time", "contractor", "intern"] as const
export type IEmployeeType = (typeof EMPLOYEE_TYPES)[number]

/**
 * Contract type keys — values must match Prisma EmployeeType exactly.
 * PART_TIME: payroll from approved project Spent Time; skips weekly shift templates.
 */
export const EMPLOYEE_TYPE = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACTOR: "contractor",
  INTERN: "intern",
} as const

export const EMPLOYEE_STATUSES = [
  EMPLOYEE_STATUS.ACTIVE,
  EMPLOYEE_STATUS.INACTIVE,
  EMPLOYEE_STATUS.ON_LEAVE,
  EMPLOYEE_STATUS.TERMINATED,
] as const
export type IEmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const ROLE = {
  ADMIN: "admin",
  GENERAL_MANAGER: "general_manager",
  HR_MANAGER: "hr_manager",
  TEAM_LEADER: "team_leader",
  EMPLOYEE: "employee",
} as const

export const GM_SCOPES = ["all", "department", "region"] as const
