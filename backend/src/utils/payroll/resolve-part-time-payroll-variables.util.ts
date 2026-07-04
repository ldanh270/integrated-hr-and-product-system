import { PART_TIME_PAYROLL_VARIABLE_DEFAULTS } from "@/configs/entities/part-time-payroll.config.ts"

export interface ResolvedPartTimePayrollVariables {
  overtimeMultiplier: number
  workingDayMultiplier: number
  defaultHourlyRate: number | null
}

interface PartTimePayrollContext {
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

/** Reads PT SalaryVariable codes from payroll context; zero default rate means "must set on project". */
export function resolvePartTimePayrollVariables(
  context: Record<string, number>,
): ResolvedPartTimePayrollVariables {
  const {
    partTimeOvertimeMultiplier,
    partTimeWorkingDayMultiplier,
    partTimeDefaultHourlyRate,
  } = context as PartTimePayrollContext

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
