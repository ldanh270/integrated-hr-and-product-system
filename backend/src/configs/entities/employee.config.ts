export const ROLE = {
  ADMIN: "admin",
  HR_MANAGER: "hr_manager",
  GENERAL_MANAGER: "general_manager",
  TEAM_LEADER: "team_leader",
  EMPLOYEE: "employee",
} as const

export const EMPLOYEE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "on_leave",
  TERMINATED: "terminated",
} as const

export const EMPLOYEE_TYPES = ["full_time", "part_time", "contractor", "intern"] as const
export type IEmployeeType = (typeof EMPLOYEE_TYPES)[number]

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

export const EMPLOYEE_ROLES = [
  ROLE.EMPLOYEE,
  ROLE.TEAM_LEADER,
  ROLE.HR_MANAGER,
  ROLE.GENERAL_MANAGER,
  ROLE.ADMIN,
] as const

export const GM_SCOPES = ["all", "department", "region"] as const
