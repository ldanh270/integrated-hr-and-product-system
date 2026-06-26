
export const EMPLOYEE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "on_leave",
  TERMINATED: "terminated",
} as const

export const EMPLOYEE_TYPES = ["full_time", "part_time", "contractor", "intern"] as const
export type IEmployeeType = (typeof EMPLOYEE_TYPES)[number]

export const EMPLOYEE_STATUSES = [
  EMPLOYEE_STATUS.ACTIVE,
  EMPLOYEE_STATUS.INACTIVE,
  EMPLOYEE_STATUS.ON_LEAVE,
  EMPLOYEE_STATUS.TERMINATED,
] as const
export type IEmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const SYSTEM_ROLE = {
  ADMIN: "admin",
  GENERAL_MANAGER: "general_manager",
  HR_MANAGER: "hr_manager",
  TEAM_LEADER: "team_leader",
  EMPLOYEE: "employee",
} as const

export const SYSTEM_ROLE_NAMES = [
  SYSTEM_ROLE.EMPLOYEE,
  SYSTEM_ROLE.TEAM_LEADER,
  SYSTEM_ROLE.HR_MANAGER,
  SYSTEM_ROLE.GENERAL_MANAGER,
  SYSTEM_ROLE.ADMIN,
] as const
export type ISystemRole = (typeof SYSTEM_ROLE_NAMES)[number]


export const GM_SCOPES = ["all", "department", "region"] as const
