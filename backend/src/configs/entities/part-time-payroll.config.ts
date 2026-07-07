import { SPENT_TIME_RULES } from "@/configs/rules/project.config.ts"

/** SalaryVariable.code values used when calculating part-time payslips. */
export const PART_TIME_PAYROLL_VARIABLE = {
  OVERTIME_MULTIPLIER: "partTimeOvertimeMultiplier",
  WORKING_DAY_MULTIPLIER: "partTimeWorkingDayMultiplier",
  DEFAULT_HOURLY_RATE: "partTimeDefaultHourlyRate",
} as const

export const PART_TIME_PAYROLL_VARIABLE_CODES = [
  PART_TIME_PAYROLL_VARIABLE.OVERTIME_MULTIPLIER,
  PART_TIME_PAYROLL_VARIABLE.WORKING_DAY_MULTIPLIER,
  PART_TIME_PAYROLL_VARIABLE.DEFAULT_HOURLY_RATE,
] as const

export type IPartTimePayrollVariableCode = (typeof PART_TIME_PAYROLL_VARIABLE_CODES)[number]

/** Fallback when SalaryVariable row is missing or inactive. */
export const PART_TIME_PAYROLL_VARIABLE_DEFAULTS = {
  OVERTIME_MULTIPLIER: SPENT_TIME_RULES.OVERTIME_MULTIPLIER,
  WORKING_DAY_MULTIPLIER: 1,
  DEFAULT_HOURLY_RATE: 0,
} as const

/** Seed rows for SalaryVariable admin UI — editable without redeploy. */
export const PART_TIME_PAYROLL_VARIABLE_SEED = [
  {
    code: PART_TIME_PAYROLL_VARIABLE.OVERTIME_MULTIPLIER,
    name: "Hệ số giờ tăng ca (PT)",
    value: PART_TIME_PAYROLL_VARIABLE_DEFAULTS.OVERTIME_MULTIPLIER,
    description:
      "Nhân với đơn giá/giờ khi Spent Time loại overtime. Công thức: giờ × đơn giá × hệ số.",
  },
  {
    code: PART_TIME_PAYROLL_VARIABLE.WORKING_DAY_MULTIPLIER,
    name: "Hệ số giờ làm thường (PT)",
    value: PART_TIME_PAYROLL_VARIABLE_DEFAULTS.WORKING_DAY_MULTIPLIER,
    description: "Nhân với đơn giá/giờ khi Spent Time loại ngày làm thường.",
  },
  {
    code: PART_TIME_PAYROLL_VARIABLE.DEFAULT_HOURLY_RATE,
    name: "Đơn giá/giờ mặc định (PT)",
    value: PART_TIME_PAYROLL_VARIABLE_DEFAULTS.DEFAULT_HOURLY_RATE,
    description:
      "Dùng khi thành viên dự án chưa khai báo hourlyRate. Đặt 0 để bắt buộc khai báo trên dự án.",
  },
] as const
