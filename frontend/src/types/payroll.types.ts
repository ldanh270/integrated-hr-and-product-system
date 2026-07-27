import type {
  ComponentType,
  ComponentValueType,
  PayrollStatus,
} from "@/config/entities/payroll.config"

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

export type PayslipReceiptStatus = "not_received" | "received"

export interface IPayslipDailyWorkLog {
  date: string
  dayOfMonth: number
  employeeShiftId?: string | null
  shiftName?: string | null
  status: string
  workMinutes: number
  workHours: number
  overtimeMinutes: number
  lateMinutes: number
  earlyLeaveMinutes: number
  checkInAt?: string | null
  checkOutAt?: string | null
  note?: string | null
}

export interface IPayslip {
  id: string
  payrollId: string
  employeeId: string
  periodMonth?: number
  periodYear?: number
  status?: PayrollStatus
  receiptStatus?: PayslipReceiptStatus
  isPreview?: boolean
  canFeedback?: boolean
  netSalary: number
  totalAdditions: number
  totalDeductions: number
  workingDays: number
  absentDays: number
  overtimeMinutes: number
  details: IPayslipDetail[]
  dailyWorkLogs?: IPayslipDailyWorkLog[]
  createdAt: string
  updatedAt: string
}

export interface IPayslipFeedbackPayload {
  date: string
  reason: string
  checkInAt?: string | null
  checkOutAt?: string | null
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
  code: string
  name: string
  type: ComponentType
  valueType: ComponentValueType
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
  createdBy?: {
    fullName: string
  }
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
  note?: string

  createdAt: string
  updatedAt: string
}

export interface IPayrollSettings {
  id: string
  triggerDay: number
  triggerHour: number
  triggerMinute: number
  approvalDay: number
  approvalHour: number
  approvalMinute: number
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
