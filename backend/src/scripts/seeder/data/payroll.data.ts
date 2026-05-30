export const BASE_PAYROLL_COMPONENTS = [
  {
    name: "Base Salary",
    type: "addition" as const,
    valueType: "fixed" as const,
    value: 5000,
    description: "Core monthly contract salary",
  },
  {
    name: "Overtime Pay",
    type: "addition" as const,
    valueType: "formula" as const,
    value: 1.5,
    description: "1.5x of hourly rate for OT hours",
  },
  {
    name: "Project Allowance",
    type: "addition" as const,
    valueType: "fixed" as const,
    value: 300,
    description: "Bonus for active project participation",
  },
  {
    name: "Health Insurance",
    type: "deduction" as const,
    valueType: "percentage" as const,
    value: 1.5,
    description: "1.5% deduction for health insurance contribution",
  },
  {
    name: "Social Security",
    type: "deduction" as const,
    valueType: "percentage" as const,
    value: 8.0,
    description: "8% mandatory social security deduction",
  },
]

export const PAYROLL_TEMPLATES = [
  {
    name: "Standard Full-Time Template",
    description: "Default payroll structure for standard full-time employees",
  },
  {
    name: "Internship Template",
    description: "Lightweight payroll structure for temporary interns",
  },
]

export const DEFAULT_PAYROLL_SETTINGS = {
  triggerDay: 25,
}

export const PAYROLL_PERIODS = [
  { month: 4, year: 2026, status: "paid" as const },
  { month: 5, year: 2026, status: "approved" as const },
]
