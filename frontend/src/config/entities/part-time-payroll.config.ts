/** Mirrors backend PART_TIME_PAYROLL_VARIABLE — SalaryVariable.code for PT payslip. */
export const PART_TIME_PAYROLL_VARIABLE = {
  /** Applied when assigned hours exceed the scheduled window. */
  OVERTIME_MULTIPLIER: "partTimeOvertimeMultiplier",
  /** Converts hourly rate to a per-day amount for payslip formulas. */
  WORKING_DAY_MULTIPLIER: "partTimeWorkingDayMultiplier",
  /** Fallback hourly rate when employee has no salary record. */
  DEFAULT_HOURLY_RATE: "partTimeDefaultHourlyRate",
} as const

export const PART_TIME_PAYROLL_VARIABLE_CODES = [
  PART_TIME_PAYROLL_VARIABLE.OVERTIME_MULTIPLIER,
  PART_TIME_PAYROLL_VARIABLE.WORKING_DAY_MULTIPLIER,
  PART_TIME_PAYROLL_VARIABLE.DEFAULT_HOURLY_RATE,
] as const
