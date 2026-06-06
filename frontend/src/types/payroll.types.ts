import type { ComponentType, PayrollStatus } from "@/config/entities/payroll.config"

export interface IPayroll {
  id: string
  periodMonth: number
  periodYear: number
  status: PayrollStatus
  totalAmount: number
  approvedById?: string
  approvedAt?: string
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

export interface IPayslipDetail {
  componentId: string
  name: string
  type: ComponentType
  value: number
}

export interface IPayslip {
  id: string
  payrollId: string
  employeeId: string
  netSalary: number
  totalAdditions: number
  totalDeductions: number
  workingDays: number
  absentDays: number
  overtimeMinutes: number
  details: IPayslipDetail[]
  createdAt: string
  updatedAt: string
}

export interface ISalaryComponent {
  id: string
  name: string
  type: ComponentType
  formula: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IPayslipTemplateComponent {
  componentId: string
  overrideFormula: string | null
  component: ISalaryComponent
}

export interface IPayslipTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  components: IPayslipTemplateComponent[]
  createdAt: string
  updatedAt: string
}

export interface IEmployeeSalaryConfig {
  id: string
  employeeId: string
  templateId: string
  baseSalary: number
  effectiveFrom: string
  effectiveTo?: string
  mealAllowance: number
  transportAllowance: number
  housingAllowance: number
  phoneAllowance: number
  responsibilityAllowance: number
  seniorityAllowance: number
  note?: string
  createdAt: string
  updatedAt: string
}
