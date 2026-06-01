export declare const ROLE: {
  readonly ADMIN: "admin"
  readonly HR_MANAGER: "hr_manager"
  readonly GENERAL_MANAGER: "general_manager"
  readonly TEAM_LEADER: "team_leader"
  readonly EMPLOYEE: "employee"
}
export declare const EMPLOYEE_STATUS: {
  readonly ACTIVE: "active"
  readonly INACTIVE: "inactive"
  readonly ON_LEAVE: "on_leave"
  readonly TERMINATED: "terminated"
}
export declare const EMPLOYEE_TYPES: readonly ["full_time", "part_time", "contractor", "intern"]
export type IEmployeeType = (typeof EMPLOYEE_TYPES)[number]
export declare const EMPLOYEE_STATUSES: readonly ["active", "inactive", "on_leave", "terminated"]
export type IEmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]
export declare const EMPLOYEE_ROLES: readonly [
  "employee",
  "team_leader",
  "hr_manager",
  "general_manager",
  "admin",
]
export type IEmployeeRole = (typeof EMPLOYEE_ROLES)[number]
