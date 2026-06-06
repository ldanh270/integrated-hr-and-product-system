import { type IEmployeeRole, ROLE } from "@/config/entities/employee.config"

export const PAYROLL_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const
export type PayrollStatus = (typeof PAYROLL_STATUS)[keyof typeof PAYROLL_STATUS]

export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
}

// Maps to shadcn Badge variant
export const PAYROLL_STATUS_BADGE: Record<
  PayrollStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  PENDING: "default",
  APPROVED: "outline", // will override with success token via className
  REJECTED: "destructive",
}

export const COMPONENT_TYPE = { ADDITION: "ADDITION", DEDUCTION: "DEDUCTION" } as const
export type ComponentType = (typeof COMPONENT_TYPE)[keyof typeof COMPONENT_TYPE]

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  ADDITION: "Cộng vào",
  DEDUCTION: "Khấu trừ",
}

// Role groups for use-role-guard
export const PAYROLL_MANAGER_ROLES: readonly IEmployeeRole[] = [
  ROLE.ADMIN,
  ROLE.HR_MANAGER,
  ROLE.GENERAL_MANAGER,
]
export const PAYROLL_EDITOR_ROLES: readonly IEmployeeRole[] = [ROLE.ADMIN, ROLE.HR_MANAGER]
export const PAYROLL_APPROVER_ROLES: readonly IEmployeeRole[] = [ROLE.ADMIN, ROLE.GENERAL_MANAGER]
