export const SALARY_COMPONENT_TYPES = ["addition", "deduction"] as const
export type SalaryComponentType = (typeof SALARY_COMPONENT_TYPES)[number]

export const PAYROLL_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "paid",
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
