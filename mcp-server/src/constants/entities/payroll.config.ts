export const SALARY_COMPONENT_TYPES = ["addition", "deduction"] as const
export type SalaryComponentType = (typeof SALARY_COMPONENT_TYPES)[number]

export const COMPONENT_TYPE = { ADDITION: "addition", DEDUCTION: "deduction" } as const

export const PAYROLL_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
} as const

export const PAYROLL_STATUSES = [
  PAYROLL_STATUS.DRAFT,
  PAYROLL_STATUS.PENDING_APPROVAL,
  PAYROLL_STATUS.APPROVED,
  PAYROLL_STATUS.REJECTED,
  PAYROLL_STATUS.PAID,
] as const
export type PayrollStatusType = (typeof PAYROLL_STATUSES)[number]

// Formula context variable names (documentation / validation)
export const FORMULA_CONTEXT_VARS = [
  "baseSalary",
  "mealAllowance",
  "transportAllowance",
  "housingAllowance",
  "phoneAllowance",
  "responsibilityAllowance",
  "seniorityAllowance",
  "standardDays",
  "workingDays",
  "absentDays",
  "overtimeMinutes",
  "lateMinutes",
  "holidayDays",
] as const

// Helper functions
export const generateDefaultPayrollName = (month: number, year: number): string => {
  return `Bảng lương tháng ${month}/${year}`
}
