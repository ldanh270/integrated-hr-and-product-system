import {
  PART_TIME_PAYROLL_VARIABLE,
  PART_TIME_PAYROLL_VARIABLE_DEFAULTS,
} from "@/configs/entities/part-time-payroll.config.ts"

export interface ResolvedPartTimePayrollVariables {
  overtimeMultiplier: number
  workingDayMultiplier: number
  defaultHourlyRate: number | null
}

export interface PartTimePayrollContext {
  partTimeOvertimeMultiplier?: number
  partTimeWorkingDayMultiplier?: number
  partTimeDefaultHourlyRate?: number
}

function readOptionalNumber(value: number | undefined, fallback: number): number {
  if (typeof value !== "number") {
    return fallback
  }

  if (Number.isNaN(value)) {
    return fallback
  }

  return value
}

/** Maps SalaryVariable rows to typed PT payroll inputs (avoids dynamic Record indexing). */
export function pickPartTimePayrollContext(
  variables: Record<string, number>,
): PartTimePayrollContext {
  return {
    partTimeOvertimeMultiplier: variables[PART_TIME_PAYROLL_VARIABLE.OVERTIME_MULTIPLIER],
    partTimeWorkingDayMultiplier: variables[PART_TIME_PAYROLL_VARIABLE.WORKING_DAY_MULTIPLIER],
    partTimeDefaultHourlyRate: variables[PART_TIME_PAYROLL_VARIABLE.DEFAULT_HOURLY_RATE],
  }
}

/** Reads PT SalaryVariable codes from payroll context; zero default rate means "must set on project". */
export function resolvePartTimePayrollVariables(
  context: PartTimePayrollContext,
): ResolvedPartTimePayrollVariables {
  const {
    partTimeOvertimeMultiplier,
    partTimeWorkingDayMultiplier,
    partTimeDefaultHourlyRate,
  } = context

  const overtimeMultiplier = readOptionalNumber(
    partTimeOvertimeMultiplier,
    PART_TIME_PAYROLL_VARIABLE_DEFAULTS.OVERTIME_MULTIPLIER,
  )
  const workingDayMultiplier = readOptionalNumber(
    partTimeWorkingDayMultiplier,
    PART_TIME_PAYROLL_VARIABLE_DEFAULTS.WORKING_DAY_MULTIPLIER,
  )
  const defaultHourlyRate = readOptionalNumber(
    partTimeDefaultHourlyRate,
    PART_TIME_PAYROLL_VARIABLE_DEFAULTS.DEFAULT_HOURLY_RATE,
  )

  return {
    overtimeMultiplier,
    workingDayMultiplier,
    defaultHourlyRate: defaultHourlyRate > 0 ? defaultHourlyRate : null,
  }
}
