import { type IEmployeeRole, ROLE } from "@/config/entities/employee.config"

export const PAYROLL_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
} as const
export type PayrollStatus = (typeof PAYROLL_STATUS)[keyof typeof PAYROLL_STATUS]

export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  draft: "Bản nháp",
  pending_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  paid: "Đã thanh toán",
}

// Maps to shadcn Badge variant
export const PAYROLL_STATUS_BADGE: Record<
  PayrollStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "secondary",
  pending_approval: "default",
  approved: "outline", // will override with success token via className
  rejected: "destructive",
  paid: "outline",
}

export const SALARY_COMPONENT_TYPES = ["addition", "deduction"] as const

export const COMPONENT_TYPE = { ADDITION: "addition", DEDUCTION: "deduction" } as const
export type ComponentType = (typeof COMPONENT_TYPE)[keyof typeof COMPONENT_TYPE]

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  addition: "Cộng vào",
  deduction: "Khấu trừ",
}

export const SALARY_COMPONENT_VALUE_TYPES = ["currency", "number", "percentage"] as const

export const COMPONENT_VALUE_TYPE = { CURRENCY: "currency", NUMBER: "number", PERCENTAGE: "percentage" } as const
export type ComponentValueType = (typeof COMPONENT_VALUE_TYPE)[keyof typeof COMPONENT_VALUE_TYPE]

export const COMPONENT_VALUE_TYPE_LABELS: Record<ComponentValueType, string> = {
  currency: "Tiền tệ",
  number: "Số",
  percentage: "Phần trăm",
}

// Role groups for use-role-guard
export const PAYROLL_MANAGER_ROLES: readonly IEmployeeRole[] = [
  ROLE.ADMIN,
  ROLE.HR_MANAGER,
  ROLE.GENERAL_MANAGER,
]
export const PAYROLL_EDITOR_ROLES: readonly IEmployeeRole[] = [ROLE.ADMIN, ROLE.HR_MANAGER]
export const PAYROLL_APPROVER_ROLES: readonly IEmployeeRole[] = [ROLE.ADMIN, ROLE.GENERAL_MANAGER]
