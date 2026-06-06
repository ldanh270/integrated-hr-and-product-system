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
  periodMonth?: number
  periodYear?: number
  status?: PayrollStatus
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

export interface IPayslipWithEmployee extends IPayslip {
  employee?: {
    id: string
    fullName: string
    email: string
  }
}

export interface IPayrollWithPayslips extends IPayroll {
  payslips: IPayslipWithEmployee[]
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

export interface ICustomSalaryFieldConfig {
  fieldId: string
  value: number
}

export interface IEmployeeSalaryConfig {
  id: string
  employeeId: string
  templateId: string
  baseSalary: number
  effectiveFrom: string
  effectiveTo?: string
  note?: string
  customFields?: ICustomSalaryFieldConfig[]
  createdAt: string
  updatedAt: string
}

export interface IPayrollSettings {
  id: string
  triggerDay: number
  updatedById?: string
  createdAt?: string
  updatedAt?: string
}

export interface ICustomSalaryField {
  id: string
  code: string
  name: string
  defaultValue: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
