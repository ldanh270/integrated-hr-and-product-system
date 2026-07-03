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

export const WORK_SCHEDULE_TYPES = ["full_time", "part_time"] as const
export type IWorkScheduleType = (typeof WORK_SCHEDULE_TYPES)[number]

/** Employment category options in HR forms (excludes legacy part_time). */
export const EMPLOYMENT_CATEGORY_TYPES = ["full_time", "contractor", "intern"] as const
export type IEmploymentCategoryType = (typeof EMPLOYMENT_CATEGORY_TYPES)[number]

/**
 * Contract type keys — values must match backend/Prisma EmployeeType exactly.
 * PART_TIME (legacy): use workScheduleType for schedule-based logic.
 */
export const EMPLOYEE_TYPE = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACTOR: "contractor",
  INTERN: "intern",
} as const

export const WORK_SCHEDULE_TYPE = {
  FULL_TIME: "full_time",
  /** Drives PT availability nav and shift-assignment flows (not legacy employeeType). */
  PART_TIME: "part_time",
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
export type IEmployeeRole = (typeof EMPLOYEE_ROLES)[number]

export const MANAGER_ROLES = [
  ROLE.ADMIN,
  ROLE.HR_MANAGER,
  ROLE.GENERAL_MANAGER,
  ROLE.TEAM_LEADER,
] as const

export const ROLE_LABELS: Record<string, string> = {
  [ROLE.ADMIN]: "Quản trị viên",
  [ROLE.GENERAL_MANAGER]: "Tổng quản lý",
  [ROLE.HR_MANAGER]: "Quản lý nhân sự",
  [ROLE.TEAM_LEADER]: "Trưởng nhóm",
  [ROLE.EMPLOYEE]: "Nhân viên",
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

export const WORK_SCHEDULE_TYPE_LABELS: Record<IWorkScheduleType, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
} as const

/** Tab id for filtering employees by part-time work schedule. */
export const EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME = "schedule_part_time" as const

export const EMPLOYEE_STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  [EMPLOYEE_STATUS.ACTIVE]: "success",
  [EMPLOYEE_STATUS.INACTIVE]: "neutral",
  [EMPLOYEE_STATUS.ON_LEAVE]: "warning",
  [EMPLOYEE_STATUS.TERMINATED]: "danger",
} as const
