export const SYSTEM_ROLE = {
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

/**
 * Contract type keys — values must match backend/Prisma EmployeeType exactly.
 * PART_TIME: Spent Time workflow; weekly schedule UI hidden in EmployeeEditDrawer.
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

export const EMPLOYEE_ROLES = [
  SYSTEM_ROLE.EMPLOYEE,
  SYSTEM_ROLE.TEAM_LEADER,
  SYSTEM_ROLE.HR_MANAGER,
  SYSTEM_ROLE.GENERAL_MANAGER,
  SYSTEM_ROLE.ADMIN,
] as const
export type IEmployeeRole = (typeof EMPLOYEE_ROLES)[number]

export const MANAGER_ROLES = [
  SYSTEM_ROLE.ADMIN,
  SYSTEM_ROLE.HR_MANAGER,
  SYSTEM_ROLE.GENERAL_MANAGER,
  SYSTEM_ROLE.TEAM_LEADER,
] as const

export const ROLE_LABELS: Record<string, string> = {
  [SYSTEM_ROLE.ADMIN]: "Quản trị viên",
  [SYSTEM_ROLE.GENERAL_MANAGER]: "Tổng quản lý",
  [SYSTEM_ROLE.HR_MANAGER]: "Quản lý nhân sự",
  [SYSTEM_ROLE.TEAM_LEADER]: "Trưởng nhóm",
  [SYSTEM_ROLE.EMPLOYEE]: "Nhân viên",
} as const

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  [EMPLOYEE_STATUS.ACTIVE]: "Đang làm việc",
  [EMPLOYEE_STATUS.INACTIVE]: "Tạm nghỉ",
  [EMPLOYEE_STATUS.ON_LEAVE]: "Nghỉ phép",
  [EMPLOYEE_STATUS.TERMINATED]: "Đã nghỉ việc",
} as const

export const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  full_time: "Chính thức",
  part_time: "Bán thời gian",
  contractor: "Hợp đồng",
  intern: "Thực tập",
} as const

export const EMPLOYEE_STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  [EMPLOYEE_STATUS.ACTIVE]: "success",
  [EMPLOYEE_STATUS.INACTIVE]: "neutral",
  [EMPLOYEE_STATUS.ON_LEAVE]: "warning",
  [EMPLOYEE_STATUS.TERMINATED]: "danger",
} as const
